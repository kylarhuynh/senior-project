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

const ActivityFeed: React.FC = () => {
    const navigate = useNavigate();
    const [workouts, setWorkouts] = useState<WorkoutWithSets[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchWorkouts();
    }, []);

    const fetchWorkouts = async () => {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('User not logged in');
            setLoading(false);
            return;
        }

        // Fetch workouts with their sets
        const { data: workoutsData, error: workoutsError } = await supabase
            .from('completed_workouts')
            .select('id, workout_name, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (workoutsError) {
            setError('Failed to load workouts');
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

        setWorkouts(workoutsWithSets);
        setLoading(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
    };

    const calculateWorkoutStats = (sets: WorkoutWithSets['sets']) => {
        const totalWeight = sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
        const uniqueExercises = new Set(sets.map(set => set.exercise_name)).size;
        const totalSets = sets.length;

        return { totalWeight, uniqueExercises, totalSets };
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            {loading ? (
                <div className="content-card" style={{ textAlign: 'center', padding: '40px' }}>
                    Loading...
                </div>
            ) : error ? (
                <div className="content-card" style={{ color: '#e74c3c', padding: '20px' }}>
                    {error}
                </div>
            ) : workouts.length === 0 ? (
                <div className="content-card" style={{ textAlign: 'center', padding: '40px' }}>
                    <h3 style={{ marginBottom: '16px' }}>No workouts yet</h3>
                    <button 
                        className="primary-button"
                        onClick={() => navigate('/workout-creator')}
                    >
                        Record Your First Workout
                    </button>
                </div>
            ) : (
                workouts.map((workout) => {
                    const stats = calculateWorkoutStats(workout.sets);
                    return (
                        <div key={workout.id} className="content-card">
                            <div style={{ marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                                    {workout.workout_name}
                                </h3>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                    {formatDate(workout.created_at)}
                                </div>
                            </div>

                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '16px',
                                padding: '16px',
                                background: 'var(--background-color)',
                                borderRadius: '4px',
                                marginBottom: '16px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--primary-color)' }}>
                                        {stats.totalWeight.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        Total Weight (lbs)
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: 600 }}>
                                        {stats.uniqueExercises}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        Exercises
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '24px', fontWeight: 600 }}>
                                        {stats.totalSets}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        Total Sets
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                {workout.sets.map((set, index) => (
                                    <div 
                                        key={index}
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr auto auto',
                                            gap: '12px',
                                            padding: '8px 0',
                                            borderBottom: index < workout.sets.length - 1 ? '1px solid var(--border-color)' : 'none'
                                        }}
                                    >
                                        <span style={{ fontWeight: 500 }}>{set.exercise_name}</span>
                                        <span>{set.weight} lbs</span>
                                        <span>{set.reps} reps</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default ActivityFeed; 