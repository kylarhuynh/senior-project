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
        <div className="calories-container">
            <h1>Calorie Tracker</h1>
            {calorieGoal !== null && (
                <div className="fixed-top-right">
                    <button className="edit-goal-btn" onClick={() => setShowEditGoalModal(true)}>
                        Edit Calorie Goal
                    </button>
                </div>
            )}

            {calorieGoal === null ? (
                <div className="goal-setup">
                    <p>You haven't set a daily calorie goal yet.</p>
                    <input type="number" placeholder="Enter daily calorie goal" value={newCalorieGoal} onChange={(e) => setNewCalorieGoal(e.target.value)} />
                    <button onClick={handleSetCalorieGoal}>Set Goal</button>
                </div>
            ) : (
                <div className="calorie-overview">
                    <h2>Total: {totalCalories} cal</h2>
                    <h3>Remaining: {calorieGoal - totalCalories} cal</h3>
                </div>
            )}

            {calorieGoal !== null && (
                <>
                    <div className="food-entry">
                        <input type="text" placeholder="Food Name" value={foodName} onChange={(e) => setFoodName(e.target.value)} />
                        <select value={measurementType} onChange={(e) => setMeasurementType(e.target.value)}>
                            <option value="serving">Serving</option>
                            <option value="grams">Grams</option>
                            <option value="ounces">Ounces</option>
                        </select>
                        <input type="number" min="1" placeholder="Amount" value={measurementAmount} onChange={(e) => setMeasurementAmount(e.target.value)} />
                        <input type="number" placeholder="Calories" value={loadingCalories ? '' : calories} onChange={(e) => setCalories(e.target.value)} />
                        <button onClick={handleAddEntry}>Add</button>
                    </div>

                    <h3>Today's Meals</h3>
                    <ul>
                        {entries.map(entry => (
                            <li key={entry.id}>
                                {editingEntry && editingEntry.id === entry.id ? (
                                    <>
                                        <input type="text" value={updatedFoodName} onChange={(e) => setUpdatedFoodName(e.target.value)} />
                                        <input type="number" value={updatedCalories} onChange={(e) => setUpdatedCalories(e.target.value)} />
                                        <button onClick={handleSaveEdit}>Save</button>
                                        <button onClick={() => setEditingEntry(null)}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        {entry.food_name} - {entry.calories} cal
                                        <button onClick={() => handleEditEntry(entry)}>Edit</button>
                                        <button onClick={() => handleDeleteEntry(entry.id, entry.calories)}>Delete</button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => navigate('/calorie-history')}>View Previous Days</button>
                </>
            )}

            <div className="fixed-bottom-left">
                <button onClick={handleBackButton}>Home</button>
            </div>
        </div>
    );
};

export default CaloriesHome;
