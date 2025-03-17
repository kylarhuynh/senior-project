import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';

const CaloriesHome: React.FC = () => {
    const navigate = useNavigate();
    const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
    const [newCalorieGoal, setNewCalorieGoal] = useState<string>('');
    const [foodName, setFoodName] = useState('');
    const [calories, setCalories] = useState('');
    const [entries, setEntries] = useState<{ id: string; food_name: string; calories: number }[]>([]);
    const [totalCalories, setTotalCalories] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showEditGoalModal, setShowEditGoalModal] = useState(false); // Controls the modal

    useEffect(() => {
        fetchCalorieGoal();
        fetchTodaysEntries();
    }, []);

    const handleBackButton = () => {
        navigate('/home');
    };

    // Fetch user's calorie goal properly
    const fetchCalorieGoal = async () => {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error('Error fetching user:', userError);
            return;
        }

        const { data, error } = await supabase
            .from('users')
            .select('calorie_goal')
            .eq('id', userData.user.id)
            .single();

        if (error) {
            console.error('Error fetching calorie goal:', error);
            return;
        }

        setCalorieGoal(data.calorie_goal);
    };

    // Fetch today's calorie entries properly
    const fetchTodaysEntries = async () => {
        setLoading(true);

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error('Error fetching user:', userError);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('calorie_entries')
            .select('*')
            .eq('user_id', userData.user.id)
            .eq('date', new Date().toISOString().split('T')[0]);

        if (error) {
            console.error('Error fetching entries:', error);
            setLoading(false);
            return;
        }

        setEntries(data);
        setTotalCalories(data.reduce((sum, entry) => sum + entry.calories, 0));
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

    // Add food entry
    const handleAddEntry = async () => {
        if (!foodName.trim() || !calories.trim() || isNaN(parseInt(calories))) {
            setError('Enter a valid food name and calorie amount.');
            return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error('Error fetching user:', userError);
            return;
        }

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

        if (error) {
            console.error('Error adding entry:', error);
            return;
        }

        setEntries([...entries, data[0]]);
        setTotalCalories(totalCalories + parseInt(calories));
        setFoodName('');
        setCalories('');
    };

    // Delete an entry properly
    const handleDeleteEntry = async (id: string, cal: number) => {
        const { error } = await supabase.from('calorie_entries').delete().eq('id', id);

        if (error) {
            console.error('Error deleting entry:', error);
            return;
        }

        setEntries(entries.filter(entry => entry.id !== id));
        setTotalCalories(totalCalories - cal);
    };

    return (
        <div className="calories-container">
            <h1>Calorie Tracker</h1>

            {/* Edit Calorie Goal Button */}
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
                            value={calories}
                            onChange={(e) => setCalories(e.target.value)}
                        />
                        <button onClick={handleAddEntry}>Add</button>
                    </div>

                    <h3>Today's Meals</h3>
                    {loading ? (
                        <p>Loading entries...</p>
                    ) : (
                        <ul className="food-list">
                            {entries.map(entry => (
                                <li key={entry.id}>
                                    {entry.food_name} - {entry.calories} cal
                                    <button onClick={() => handleDeleteEntry(entry.id, entry.calories)}>Delete</button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <button onClick={() => navigate('/previous-calories')}>View Previous Days</button>
                </>
            )}

            <div className="fixed-bottom-left">
                <button onClick={handleBackButton}>Home</button>
            </div>

            {showEditGoalModal && (
                <div className="modal-overlay" onClick={() => setShowEditGoalModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Edit Calorie Goal</h2>
                        <input
                            type="number"
                            placeholder="New calorie goal"
                            value={newCalorieGoal}
                            onChange={(e) => setNewCalorieGoal(e.target.value)}
                        />
                        <button onClick={handleSetCalorieGoal}>Update Goal</button>
                        <button onClick={() => setShowEditGoalModal(false)}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaloriesHome;
