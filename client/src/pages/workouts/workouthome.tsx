import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';

type WorkoutWithSets = {
    id: string;
    workout_name: string;
    created_at: string;
    sets: {
        exercise_name: string;
        weight: number;
        reps: number;
    }[];
};

const WorkoutHome = () => {
    const navigate = useNavigate();
    const [recentWorkouts, setRecentWorkouts] = useState<WorkoutWithSets[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentWorkouts();
    }, []);

    const fetchRecentWorkouts = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Get today's date in ISO format
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // Fetch today's workouts
        const { data: workoutsData, error: workoutsError } = await supabase
            .from('completed_workouts')
            .select('id, workout_name, created_at')
            .eq('user_id', user.id)
            .eq('is_template', false)
            .gte('created_at', todayISO)
            .order('created_at', { ascending: false });

        if (workoutsError) {
            console.error('Error fetching workouts:', workoutsError);
            setLoading(false);
            return;
        }

        // Fetch sets for each workout
        const workoutsWithSets = await Promise.all(
            workoutsData.map(async (workout) => {
                const { data: setsData } = await supabase
                    .from('completed_sets')
                    .select('exercise_name, weight, reps')
                    .eq('completed_workout_id', workout.id)
                    .order('set_number');

                return {
                    ...workout,
                    sets: setsData || []
                };
            })
        );

        setRecentWorkouts(workoutsWithSets);
        setLoading(false);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: 'numeric'
        });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            {/* Workout Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="content-card">
                    <h3 className="section-header">Quick Start</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="primary-button" onClick={() => navigate('/workout-creator')}>
                            Record Workout
                        </button>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Start a new workout session
                        </p>
                    </div>
                </div>

                <div className="content-card">
                    <h3 className="section-header">Workout Plans</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="secondary-button" onClick={() => navigate('/templates')}>
                            Browse Templates
                        </button>
                        <button className="secondary-button" onClick={() => navigate('/workout-creator', { state: { isTemplate: true } })}>
                            Create Template
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Feed Preview */}
            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="section-header" style={{ margin: 0 }}>Today's Workouts</h3>
                    <button className="secondary-button" onClick={() => navigate('/activity-feed')}>
                        View All
                    </button>
                </div>
                {loading ? (
                    <div style={{ padding: '16px', textAlign: 'center' }}>Loading...</div>
                ) : recentWorkouts.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No workouts recorded today
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {recentWorkouts.map((workout) => (
                            <div key={workout.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontWeight: 600 }}>{workout.workout_name}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                        {formatTime(workout.created_at)}
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                                    {workout.sets.map((set, index) => (
                                        <div key={index} style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            {set.exercise_name}: {set.weight}lbs × {set.reps}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WorkoutHome;
