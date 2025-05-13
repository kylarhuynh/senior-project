import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';
import axios from 'axios';

const USDA_API_KEY = "aYdSpnOpelOvhdc8zOOf9gbhkcZoEmbn6M5haqZb";

const CaloriesHome: React.FC = () => {
    const navigate = useNavigate();
    const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
    const [newCalorieGoal, setNewCalorieGoal] = useState('');
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [measurementType, setMeasurementType] = useState('serving');
    const [measurementAmount, setMeasurementAmount] = useState('1');
    const [entries, setEntries] = useState<{ id: string; food_name: string; calories: number }[]>([]);
    const [totalCalories, setTotalCalories] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingCalories, setLoadingCalories] = useState(false);
    const [error, setError] = useState('');
    const [showEditGoalModal, setShowEditGoalModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<{ id: string; food_name: string; calories: number } | null>(null);
    const [updatedFoodName, setUpdatedFoodName] = useState('');
    const [updatedCalories, setUpdatedCalories] = useState('');

    useEffect(() => {
        fetchCalorieGoal();
        fetchTodaysEntries();
    }, []);

    const handleBackButton = () => navigate('/home');

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

    const handleSetCalorieGoal = async () => {
        if (!newCalorieGoal.trim() || isNaN(parseInt(newCalorieGoal))) {
            setError('Enter a valid calorie goal.');
            return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) return;

        const { error } = await supabase
            .from('users')
            .update({ calorie_goal: parseInt(newCalorieGoal) })
            .eq('id', userData.user.id);

        if (!error) {
            setCalorieGoal(parseInt(newCalorieGoal));
            setNewCalorieGoal('');
            setShowEditGoalModal(false);
        }
    };

    useEffect(() => {
        if (!foodName.trim()) {
            setCalories('');
            return;
        }

        const timer = setTimeout(() => {
            fetchCaloriesFromUSDA(foodName);
        }, 800);

        return () => clearTimeout(timer);
    }, [foodName, measurementType, measurementAmount]);

    const fetchCaloriesFromUSDA = async (query: string) => {
        if (!query) return;
        setLoadingCalories(true);

        try {
            const response = await axios.get(`https://api.nal.usda.gov/fdc/v1/foods/search`, {
                params: {
                    api_key: USDA_API_KEY,
                    query: query,
                    dataType: "Foundation, SR Legacy",
                    pageSize: 1,
                },
            });

            if (response.data.foods.length > 0) {
                const foodItem = response.data.foods[0];
                const foodCalories = foodItem.foodNutrients.find((nutrient: any) => nutrient.nutrientId === 1008)?.value;

                if (!foodCalories) {
                    setCalories("0");
                    setError("Food found, but calorie data is missing.");
                    return;
                }

                let perGramCalories = foodCalories / 100;
                let unitCalories = 0;
                const amount = parseFloat(measurementAmount);

                switch (measurementType) {
                    case 'grams':
                        unitCalories = perGramCalories * amount;
                        break;
                    case 'ounces':
                        unitCalories = perGramCalories * amount * 28.35;
                        break;
                    case 'serving':
                    default:
                        const servingSize = foodItem.servingSize || 1;
                        unitCalories = (foodCalories / servingSize) * amount;
                        break;
                }

                setCalories(Math.round(unitCalories).toString());
            } else {
                setCalories("0");
                setError("Food not found in database.");
            }
        } catch (error) {
            console.error("Error fetching calories:", error);
            setError("Failed to fetch food data.");
        } finally {
            setLoadingCalories(false);
        }
    };

    const handleAddEntry = async () => {
        if (!foodName.trim() || !calories.trim() || isNaN(parseInt(calories))) {
            setError('Enter a valid food name and calorie amount.');
            return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) return;

        const { data, error } = await supabase
            .from('calorie_entries')
            .insert([{ user_id: userData.user.id, food_name: foodName, calories: parseInt(calories), date: new Date().toISOString().split('T')[0] }])
            .select();

        if (!error) {
            setEntries([...entries, data[0]]);
            setTotalCalories(prev => prev + parseInt(calories));
            setFoodName('');
            setCalories('');
        }
    };

    const handleEditEntry = (entry: { id: string; food_name: string; calories: number }) => {
        setEditingEntry(entry);
        setUpdatedFoodName(entry.food_name);
        setUpdatedCalories(entry.calories.toString());
    };

    const handleSaveEdit = async () => {
        if (!editingEntry) return;
        if (!updatedFoodName.trim() || !updatedCalories.trim() || isNaN(parseInt(updatedCalories))) {
            setError("Please enter valid food name and calories.");
            return;
        }

        const { error } = await supabase
            .from('calorie_entries')
            .update({ food_name: updatedFoodName, calories: parseInt(updatedCalories) })
            .eq('id', editingEntry.id);

        if (!error) {
            setEntries(entries.map(entry =>
                entry.id === editingEntry.id ? { ...entry, food_name: updatedFoodName, calories: parseInt(updatedCalories) } : entry
            ));
            setTotalCalories(prev => prev - editingEntry.calories + parseInt(updatedCalories));
            setEditingEntry(null);
        }
    };

    const handleDeleteEntry = async (id: string, cal: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
        if (!confirmDelete) return;

        const { error } = await supabase.from('calorie_entries').delete().eq('id', id);
        if (!error) {
            setEntries(entries.filter(entry => entry.id !== id));
            setTotalCalories(prev => prev - cal);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            {/* Daily Goal Section */}
            <div className="content-card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                        Daily Calorie Goal
                    </h2>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            className="secondary-button"
                            onClick={() => navigate('/calorieshistory')}
                            style={{ padding: '8px 16px' }}
                        >
                            History
                        </button>
                        <button 
                            className="primary-button"
                            onClick={() => setShowEditGoalModal(true)}
                            style={{ padding: '8px 16px' }}
                        >
                            Edit Goal
                        </button>
                    </div>
                </div>
                
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: 'var(--background-color)',
                    borderRadius: '8px'
                }}>
                    <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Current Goal</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{calorieGoal || '---'} cal</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Today's Total</div>
                        <div style={{ 
                            fontSize: '24px', 
                            fontWeight: 'bold',
                            color: totalCalories > (calorieGoal || 0) ? '#e74c3c' : 'inherit'
                        }}>
                            {totalCalories} cal
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Remaining</div>
                        <div style={{ 
                            fontSize: '24px', 
                            fontWeight: 'bold',
                            color: (calorieGoal || 0) - totalCalories < 0 ? '#e74c3c' : '#2ecc71'
                        }}>
                            {calorieGoal ? calorieGoal - totalCalories : '---'} cal
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Entry Section */}
            <div className="content-card" style={{ marginBottom: '24px' }}>
                <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    Add Food Entry
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <input
                            type="text"
                            placeholder="Search food name..."
                            value={foodName}
                            onChange={(e) => setFoodName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <input
                            type="number"
                            placeholder="Amount"
                            value={measurementAmount}
                            onChange={(e) => setMeasurementAmount(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <select
                            value={measurementType}
                            onChange={(e) => setMeasurementType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '16px',
                                backgroundColor: 'white',
                                boxSizing: 'border-box'
                            }}
                        >
                            <option value="serving">Serving</option>
                            <option value="grams">Grams</option>
                            <option value="ounces">Ounces</option>
                        </select>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: 'var(--background-color)',
                        borderRadius: '4px'
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Calories</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                {loadingCalories ? 'Calculating...' : `${calories || '0'} cal`}
                            </div>
                        </div>
                        <button
                            className="primary-button"
                            onClick={handleAddEntry}
                            disabled={loadingCalories || !foodName || !calories}
                            style={{ padding: '12px 24px' }}
                        >
                            Add Entry
                        </button>
                    </div>
                </div>
            </div>

            {/* Today's Entries Section */}
            <div className="content-card">
                <h2 style={{ marginBottom: '16px', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                    Today's Entries
                </h2>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                        Loading entries...
                    </div>
                ) : entries.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                        No entries yet today
                    </div>
                ) : (
                    <div style={{ 
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}>
                        {entries.map((entry, index) => (
                            <div
                                key={entry.id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr auto auto',
                                    gap: '12px',
                                    padding: '12px',
                                    alignItems: 'center',
                                    borderBottom: index < entries.length - 1 ? '1px solid var(--border-color)' : 'none',
                                    background: index % 2 === 0 ? 'var(--background-color)' : 'white'
                                }}
                            >
                                <div style={{ fontWeight: 500 }}>{entry.food_name}</div>
                                <div style={{ color: 'var(--text-secondary)' }}>{entry.calories} cal</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleEditEntry(entry)}
                                        style={{
                                            padding: '4px 8px',
                                            color: 'var(--text-secondary)',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEntry(entry.id, entry.calories)}
                                        style={{
                                            padding: '4px 8px',
                                            color: '#e74c3c',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Goal Modal */}
            {showEditGoalModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '400px'
                    }}>
                        <h3 style={{ marginBottom: '16px' }}>Set Daily Calorie Goal</h3>
                        <input
                            type="number"
                            placeholder="Enter calorie goal"
                            value={newCalorieGoal}
                            onChange={(e) => setNewCalorieGoal(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '16px',
                                marginBottom: '16px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                className="secondary-button"
                                onClick={() => setShowEditGoalModal(false)}
                                style={{ padding: '8px 16px' }}
                            >
                                Cancel
                            </button>
                            <button
                                className="primary-button"
                                onClick={handleSetCalorieGoal}
                                style={{ padding: '8px 16px' }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Entry Modal */}
            {editingEntry && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '24px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '400px'
                    }}>
                        <h3 style={{ marginBottom: '16px' }}>Edit Entry</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <input
                                type="text"
                                placeholder="Food name"
                                value={updatedFoodName}
                                onChange={(e) => setUpdatedFoodName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Calories"
                                value={updatedCalories}
                                onChange={(e) => setUpdatedCalories(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    className="secondary-button"
                                    onClick={() => setEditingEntry(null)}
                                    style={{ padding: '8px 16px' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="primary-button"
                                    onClick={handleSaveEdit}
                                    style={{ padding: '8px 16px' }}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div style={{
                    position: 'fixed',
                    bottom: '24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '4px',
                    zIndex: 1000
                }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default CaloriesHome;
