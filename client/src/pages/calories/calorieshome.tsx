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
                    <input
                        type="number"
                        placeholder="Enter daily calorie goal"
                        value={newCalorieGoal}
                        onChange={(e) => setNewCalorieGoal(e.target.value)}
                    />
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
                        <input
                            type="text"
                            placeholder="Food Name"
                            value={foodName}
                            onChange={(e) => setFoodName(e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Calories"
                            value={loadingCalories ? "" : calories} // ✅ No "Fetching..." text
                            onChange={(e) => setCalories(e.target.value)}
                        />
                        <button onClick={handleAddEntry}>Add</button>
                    </div>

                    <h3>Today's Meals</h3>
                    {entries.map(entry => (
                        <li key={entry.id}>
                            {entry.food_name} - {entry.calories} cal
                            <button onClick={() => handleDeleteEntry(entry.id, entry.calories)}>Delete</button>
                        </li>
                    ))}
                </>
            )}

            <div className="fixed-bottom-left">
                <button onClick={handleBackButton}>Home</button>
            </div>
        </div>
    );
};

export default CaloriesHome;
