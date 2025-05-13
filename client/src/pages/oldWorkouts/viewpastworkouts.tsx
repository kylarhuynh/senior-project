import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';

const ViewPastPage: React.FC = () => {
    const navigate = useNavigate();
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetching completed workouts from Supabase
    useEffect(() => {
        const fetchWorkouts = async () => {
            setLoading(true);
            setError(null);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('User not logged in.');
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('completed_workouts')
                .select('id, workout_name, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching workouts:', error);
                setError('Failed to load previous workouts.');
            } else {
                setWorkouts(data);
            }

            setLoading(false);
        };

        fetchWorkouts();
    }, []);

    // Navigate to Workout Details Page
    const handleWorkoutClick = (workoutId: string) => {
        navigate(`/view-workout/${workoutId}`);
    };

    // Navigate back to Workout Home
    const handleBackButton = () => {
        navigate('/workouthome');
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            height: '100vh'
        }}>
            <div className="text-center p-8 bg-white rounded-lg shadow-lg w-full max-w-md">
                <h1 style={{
                    textAlign: 'center',
                    marginBottom: '20px'
                }}>
                    Previous Workouts
                </h1>

                {loading ? (
                    <p>Loading...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : workouts.length === 0 ? (
                    <p>No previous workouts found.</p>
                ) : (
                    <ul className="exercise-list">
                        {workouts.map((workout) => (
                            <li 
                                key={workout.id} 
                                className="exercise-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleWorkoutClick(workout.id)}
                            >
                                <strong>{workout.workout_name}</strong><br />
                                <span style={{ color: '#888', fontSize: '0.9em' }}>
                                    {new Date(workout.created_at).toLocaleDateString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="fixed-bottom-left">
                <button onClick={handleBackButton}>Back</button>
            </div>
        </div>
    );
};

export default ViewPastPage;
