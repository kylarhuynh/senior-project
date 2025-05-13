import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';
import './freeworkout.css';

// Type for Set Entry
type SetEntry = {
    exercise: string;
    weight: number;
    reps: number;
};

const UseWorkout: React.FC = () => {
    const navigate = useNavigate();
    const { workoutId } = useParams<{ workoutId: string }>();
    const [workoutName, setWorkoutName] = useState<string>('');
    const [exercises, setExercises] = useState<string[]>([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
    const [weight, setWeight] = useState<string>('');
    const [reps, setReps] = useState<string>('');
    const [sets, setSets] = useState<SetEntry[]>([]);
    const [error, setError] = useState<string>('');

    // Load premade workout details on page load
    useEffect(() => {
        const fetchWorkoutDetails = async () => {
            const { data, error } = await supabase
                .from('premade_workouts')
                .select('name, exercises')
                .eq('id', workoutId)
                .single();

            if (error) {
                console.error('Failed to fetch workout:', error);
                alert('Failed to load workout.');
                navigate('/premadeworkouts');
                return;
            }

            setWorkoutName(data.name);
            setExercises(data.exercises);
        };

        fetchWorkoutDetails();
    }, [workoutId, navigate]);

    // Add new set for the current exercise
    const handleAddSet = () => {
        if (weight && reps) {
            const newSet: SetEntry = {
                exercise: exercises[currentExerciseIndex],
                weight: parseFloat(weight),
                reps: parseInt(reps)
            };

            setSets([...sets, newSet]);
            setWeight('');
            setReps('');
            setError('');
        } else {
            setError('Please enter weight and reps.');
        }
    };

    // Navigate to the next exercise
    const handleNextExercise = () => {
        if (currentExerciseIndex < exercises.length - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
        }
    };

    // Navigate to the previous exercise
    const handlePreviousExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(currentExerciseIndex - 1);
        }
    };

    // Save workout and sets to Supabase
    const saveWorkoutToDatabase = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('User not logged in.');
            return;
        }

        const { data, error } = await supabase
            .from('completed_workouts')
            .insert([{ user_id: user.id, workout_name: workoutName }])
            .select();

        if (error) {
            console.error("Error saving workout:", error);
            alert('Failed to save workout.');
            return;
        }

        const completedWorkoutId = data[0].id;
        const setsData = sets.map((set, index) => ({
            completed_workout_id: completedWorkoutId,
            exercise_name: set.exercise,
            set_number: index + 1,
            weight: set.weight,
            reps: set.reps
        }));

        const { error: setsError } = await supabase
            .from('completed_sets')
            .insert(setsData);

        if (setsError) {
            console.error("Error saving sets:", setsError);
            alert('Failed to save sets.');
        } else {
            alert('Workout completed and saved!');
            navigate('/pastworkouts');
        }
    };

    // Handle Finish Workout
    const handleFinishWorkout = async () => {
        await saveWorkoutToDatabase();
    };

    // Handle End Workout
    const handleEndWorkout = async () => {
        const confirmEnd = window.confirm("Are you sure you want to end this workout?");
        if (confirmEnd) {
            await saveWorkoutToDatabase();
        }
    };

    // Confirmation and navigation for Back button
    const handleBackButton = () => {
        const confirmLeave = window.confirm("Do you want to exit this workout?");
        if (confirmLeave) {
            navigate('/premadeworkouts');
        }
    };

    return (
        <div className="free-workout-container">
            <h1>{workoutName}</h1>
            <h2>{exercises[currentExerciseIndex]}</h2>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <input
                    type="number"
                    placeholder="Weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Reps"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                />
                <button onClick={handleAddSet}>Add Set</button>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px' }}>
                <button 
                    onClick={handlePreviousExercise} 
                    disabled={currentExerciseIndex === 0}
                >
                    Previous Exercise
                </button>
                <button onClick={currentExerciseIndex < exercises.length - 1 ? handleNextExercise : handleFinishWorkout}>
                    {currentExerciseIndex < exercises.length - 1 ? "Next Exercise" : "Finish Workout"}
                </button>
            </div>

            <div className="set-list-container">
                <ul className="set-list">
                    {sets.map((set, index) => (
                        <li key={index} className="set-item">
                            <span>{set.exercise}</span>
                            <span>{set.weight} lbs</span>
                            <span>{set.reps} reps</span>
                        </li>
                    ))}
                </ul>
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="fixed-bottom-left">
                <button onClick={handleBackButton}>Back</button>
            </div>
            <div className="fixed-bottom-right">
                <button onClick={handleEndWorkout}>End Workout</button>
            </div>
        </div>
    );
};

export default UseWorkout;
