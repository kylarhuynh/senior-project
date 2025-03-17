import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import '../styles.css';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [calorieGoal, setCalorieGoal] = useState<number | null>(null);
    const [totalCaloriesConsumed, setTotalCaloriesConsumed] = useState<number>(0);
    const [remainingCalories, setRemainingCalories] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        setLoading(true);
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error('Error fetching user:', userError);
            setLoading(false);
            return;
        }

        const userId = userData.user.id;

        // Fetch the user's calorie goal
        const { data: userCalorieData, error: calorieError } = await supabase
            .from('users')
            .select('calorie_goal')
            .eq('id', userId)
            .single();

        if (calorieError) {
            console.error('Error fetching calorie goal:', calorieError);
            setLoading(false);
            return;
        }

        setCalorieGoal(userCalorieData.calorie_goal);

        // Fetch today's calorie entries
        const { data: entriesData, error: entriesError } = await supabase
            .from('calorie_entries')
            .select('calories')
            .eq('user_id', userId)
            .eq('date', new Date().toISOString().split('T')[0]);

        if (entriesError) {
            console.error('Error fetching calorie entries:', entriesError);
            setLoading(false);
            return;
        }

        // Calculate total calories consumed today
        const totalCalories = entriesData.reduce((sum, entry) => sum + entry.calories, 0);
        setTotalCaloriesConsumed(totalCalories);

        // Calculate remaining calories
        setRemainingCalories(userCalorieData.calorie_goal - totalCalories);
        setLoading(false);
    };

    return (
        <div className="centeritems">
            {/* Center content horizontally and vertically */}
            <h1 className="heading">Home Page</h1>

            {/* Starter Box for Workouts and Calories */}
            <div style={{
                backgroundColor: '#f3f4f6',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}>
                <h2>Today's Overview</h2>

                {/* List of Workouts */}
                <div>
                    <h3>Workouts for Today</h3>
                    <ul>
                        <li>Push-ups - 3 sets of 15 reps</li>
                        <li>Squats - 3 sets of 20 reps</li>
                        <li>Jogging - 30 minutes</li>
                    </ul>
                </div>

                {/* Calories Left */}
                <div>
                    <h3>Calories Left</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : calorieGoal !== null ? (
                        <p>You have <strong>{remainingCalories}</strong> calories left for the day!</p>
                    ) : (
                        <p>No calorie goal set. <button onClick={() => navigate('/calorieshome')}>Set Goal</button></p>
                    )}
                </div>
            </div>

            <button onClick={() => navigate('/calorieshome')}>
                Input Calories
            </button>
            
            <button onClick={() => navigate('/workouthome')}>
                Workout
            </button>

            <div className="fixed-bottom-left">
                <button onClick={() => navigate('/login')}>
                    Logout
                </button>
            </div>
        </div>
    );
};

export default HomePage;
