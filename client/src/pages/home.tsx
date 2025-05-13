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
    const [userName, setUserName] = useState<string>('');

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
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="content-card">
                    <h3 className="section-header">Today's Calories</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : calorieGoal !== null ? (
                        <div>
                            <div className="stat-display">
                                <span style={{ fontSize: '32px', color: 'var(--primary-color)' }}>{remainingCalories}</span>
                                <span>calories remaining</span>
                            </div>
                            <div style={{ marginTop: '12px' }}>
                                <div className="stat-display">
                                    <span>Goal: {calorieGoal}</span>
                                </div>
                                <div className="stat-display">
                                    <span>Consumed: {totalCaloriesConsumed}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button className="primary-button" onClick={() => navigate('/calorieshome')}>Set Goal</button>
                    )}
                </div>

                <div className="content-card">
                    <h3 className="section-header">Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="primary-button" onClick={() => navigate('/workout-creator')}>
                            Record Workout
                        </button>
                        <button className="secondary-button" onClick={() => navigate('/calorieshome')}>
                            Log Meal
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="section-header" style={{ margin: 0 }}>Recent Activity</h3>
                    <button className="secondary-button" onClick={() => navigate('/activity-feed')}>
                        View All
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Your Workout History</div>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Track your progress and view past workouts
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
