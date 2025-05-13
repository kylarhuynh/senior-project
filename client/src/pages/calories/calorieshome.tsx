import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';
import axios from 'axios';

const USDA_API_KEY = "aYdSpnOpelOvhdc8zOOf9gbhkcZoEmbn6M5haqZb";

const CaloriesHome: React.FC = () => {
    const navigate = useNavigate();
    const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
    const [newCalorieGoal, setNewCalorieGoal] = useState<string>('');
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [entries, setEntries] = useState<{ id: string; food_name: string; calories: number }[]>([]);
    const [totalCalories, setTotalCalories] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingCalories, setLoadingCalories] = useState(false); // ✅ New state for fetching calories
    const [error, setError] = useState('');
    const [showEditGoalModal, setShowEditGoalModal] = useState(false);

    useEffect(() => {
        fetchCalorieGoal();
        fetchTodaysEntries();
    }, []);

    const handleBackButton = () => {
        navigate('/home');
    };

    // Fetch user's calorie goal
    const fetchCalorieGoal = async () => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) return;

        const { data, error } = await supabase
            .from('users')
            .select('calorie_goal')
            .eq('id', userData.user.id)
            .single();

        if (!error) setCalorieGoal(data.calorie_goal);
    };

    // Fetch today's calorie entries
    const fetchTodaysEntries = async () => {
        setLoading(true);
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('calorie_entries')
            .select('*')
            .eq('user_id', userData.user.id)
            .eq('date', new Date().toISOString().split('T')[0]);

        if (!error) {
            setEntries(data);
            setTotalCalories(data.reduce((sum, entry) => sum + entry.calories, 0));
        }
        setLoading(false);
    };

    // Save or update calorie goal
    const handleSetCalorieGoal = async () => {
        if (!newCalorieGoal.trim() || isNaN(parseInt(newCalorieGoal))) {
            setError('Enter a valid calorie goal.');
            return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error('Error fetching user:', userError);
            return;
        }

        const { error } = await supabase
            .from('users')
            .update({ calorie_goal: parseInt(newCalorieGoal) })
            .eq('id', userData.user.id);

        if (error) {
            console.error('Error updating calorie goal:', error);
        } else {
            setCalorieGoal(parseInt(newCalorieGoal));
            setNewCalorieGoal('');
            setShowEditGoalModal(false);
        }
    };

    // Debounce API Call for USDA Calories (Prevents Spamming API)
    useEffect(() => {
        if (!foodName.trim()) {
            setCalories('');
            return;
        }

        const timer = setTimeout(() => {
            fetchCaloriesFromUSDA(foodName);
        }, 800); // Wait 800ms before calling API

        return () => clearTimeout(timer);
    }, [foodName]);

    const fetchCaloriesFromUSDA = async (query: string) => {
        if (!query) return;
        setLoadingCalories(true);

        try {
            const response = await axios.get(
                `https://api.nal.usda.gov/fdc/v1/foods/search`,
                {
                    params: {
                        api_key: USDA_API_KEY,
                        query: query,
                        dataType: "Foundation, SR Legacy",
                        pageSize: 1,
                    },
                }
            );

            if (response.data.foods.length > 0) {
                const foodItem = response.data.foods[0];

                // Extract serving size (default to 1 if missing)
                const servingSize = foodItem.servingSize || 1;

                // Extract calories from food nutrients
                const foodCalories = foodItem.foodNutrients.find(
                    (nutrient: any) => nutrient.nutrientId === 1008
                )?.value;

                if (foodCalories) {
                    // Calories per full serving
                    const caloriesPerServing = Math.round((foodCalories / servingSize) * servingSize);

                    setCalories(caloriesPerServing.toString());
                } else {
                    setCalories("0"); // Prevent previous value from persisting
                    setError("Food found, but calorie data is missing.");
                }
            } else {
                setCalories("0"); // Prevent previous value from persisting
                setError("Food not found in database.");
            }
        } catch (error) {
            console.error("Error fetching calories:", error);
            setError("Failed to fetch food data.");
        } finally {
            setLoadingCalories(false);
        }
    };

    // Add food entry
    const handleAddEntry = async () => {
        if (!foodName.trim() || !calories.trim() || isNaN(parseInt(calories))) {
            setError('Enter a valid food name and calorie amount.');
            return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) return;

        const { data, error } = await supabase
            .from('calorie_entries')
            .insert([
                {
                    user_id: userData.user.id,
                    food_name: foodName,
                    calories: parseInt(calories),
                    date: new Date().toISOString().split('T')[0]
                }
            ])
            .select();

        if (!error) {
            setEntries([...entries, data[0]]);
            setTotalCalories(prevTotal => prevTotal + parseInt(calories));
            setFoodName('');
            setCalories('');
        }
    };

    // Delete an entry with confirmation
    const handleDeleteEntry = async (id: string, cal: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
        if (!confirmDelete) return;

        const { error } = await supabase.from('calorie_entries').delete().eq('id', id);

        if (!error) {
            setEntries(entries.filter(entry => entry.id !== id));
            setTotalCalories(prevTotal => prevTotal - cal);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            {/* Calorie Goal Section */}
            <div className="content-card">
                <h3 className="section-header">Daily Calorie Goal</h3>
                {calorieGoal === null ? (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                            type="number"
                            placeholder="Enter daily calorie goal"
                            value={newCalorieGoal}
                            onChange={(e) => setNewCalorieGoal(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                flex: 1
                            }}
                        />
                        <button className="primary-button" onClick={handleSetCalorieGoal}>Set Goal</button>
                    </div>
                ) : (
                    <div>
                        <div className="stat-display" style={{ marginBottom: '16px' }}>
                            <span style={{ fontSize: '32px', color: 'var(--primary-color)' }}>
                                {calorieGoal - totalCalories}
                            </span>
                            <span>calories remaining</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="stat-display">
                                    <span>Goal: {calorieGoal} cal</span>
                                </div>
                                <div className="stat-display">
                                    <span>Consumed: {totalCalories} cal</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button 
                                    className="secondary-button"
                                    onClick={() => navigate('/calorieshistory')}
                                >
                                    History
                                </button>
                                <button 
                                    className="secondary-button"
                                    onClick={() => setShowEditGoalModal(true)}
                                >
                                    Edit Goal
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Food Entry Section */}
            {calorieGoal !== null && (
                <div className="content-card" style={{ marginTop: '24px' }}>
                    <h3 className="section-header">Add Food Entry</h3>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '12px', 
                        marginBottom: '20px' 
                    }}>
                        <input
                            type="text"
                            placeholder="Food Name"
                            value={foodName}
                            onChange={(e) => setFoodName(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)'
                            }}
                        />
                        <input
                            type="number"
                            placeholder="Calories"
                            value={loadingCalories ? "Loading..." : calories}
                            onChange={(e) => setCalories(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                minWidth: '120px'
                            }}
                        />
                        <button className="primary-button" onClick={handleAddEntry}>Add</button>
                    </div>

                    {error && (
                        <div style={{ color: '#e74c3c', marginBottom: '16px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <h3 className="section-header">Today's Entries</h3>
                    {entries.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>
                            No entries yet today. Add your first meal above.
                        </p>
                    ) : (
                        <div>
                            {entries.map(entry => (
                                <div 
                                    key={entry.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(150px, 1fr) auto',
                                        gap: '12px',
                                        padding: '12px 0',
                                        borderBottom: '1px solid var(--border-color)',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ minWidth: '120px' }}>
                                        <div style={{ fontWeight: 500 }}>{entry.food_name}</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                            {entry.calories} calories
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteEntry(entry.id, entry.calories)}
                                        style={{
                                            padding: '4px 8px',
                                            color: '#e74c3c',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            minWidth: '60px'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Goal Modal */}
            {showEditGoalModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="section-header">Edit Calorie Goal</h3>
                        <div style={{ marginBottom: '20px' }}>
                            <input
                                type="number"
                                placeholder="Enter new calorie goal"
                                value={newCalorieGoal}
                                onChange={(e) => setNewCalorieGoal(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    marginBottom: '12px'
                                }}
                            />
                            {error && (
                                <div style={{ color: '#e74c3c', fontSize: '14px' }}>
                                    {error}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button 
                                className="secondary-button"
                                onClick={() => {
                                    setShowEditGoalModal(false);
                                    setNewCalorieGoal('');
                                    setError('');
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="primary-button"
                                onClick={handleSetCalorieGoal}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaloriesHome;
