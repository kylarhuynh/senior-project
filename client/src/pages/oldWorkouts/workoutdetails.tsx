import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';

const ViewWorkoutDetails: React.FC = () => {
    const navigate = useNavigate();
    const { workoutId } = useParams<{ workoutId: string }>();

    const [workoutName, setWorkoutName] = useState<string>('');
    const [createdAt, setCreatedAt] = useState<string>('');
    const [sets, setSets] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetching workout details and sets from Supabase
    useEffect(() => {
        const fetchWorkoutDetails = async () => {
            setLoading(true);
            setError(null);

            // Fetch workout name and date
            const { data: workoutData, error: workoutError } = await supabase
                .from('completed_workouts')
                .select('workout_name, created_at')
                .eq('id', workoutId)
                .single();

            if (workoutError) {
                console.error('Error fetching workout details:', workoutError);
                setError('Failed to load workout details.');
                setLoading(false);
                return;
            }

            setWorkoutName(workoutData.workout_name);
            setCreatedAt(new Date(workoutData.created_at).toLocaleDateString());

            // Fetch sets for the workout
            const { data: setsData, error: setsError } = await supabase
                .from('completed_sets')
                .select('exercise_name, weight, reps, set_number')
                .eq('completed_workout_id', workoutId)
                .order('set_number', { ascending: true });

            if (setsError) {
                console.error('Error fetching sets:', setsError);
                setError('Failed to load sets.');
            } else {
                setSets(setsData);
            }

            setLoading(false);
        };

        fetchWorkoutDetails();
    }, [workoutId]);

    // Navigate back to Previous Workouts Page
    const handleBackButton = () => {
        navigate('/pastworkouts');
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
                    marginBottom: '10px'
                }}>
                    {workoutName}
                </h1>
                <p style={{ color: '#888', marginBottom: '20px' }}>{createdAt}</p>

                {loading ? (
                    <p>Loading sets...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : sets.length === 0 ? (
                    <p>No sets recorded for this workout.</p>
                ) : (
                    <ul className="exercise-list">
                        {sets.map((set, index) => (
                            <li key={index} className="exercise-item">
                                <strong>Set {set.set_number}</strong><br />
                                {set.exercise_name}: {set.weight} lbs x {set.reps} reps
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

export default ViewWorkoutDetails;
