import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';
import './freeworkout.css';

// Type for Set Entry
type SetEntry = {
    id: number;
    exercise: string;
    weight: number;
    reps: number;
};

const FreeWorkout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation(); // Track navigation changes
    const [workoutName, setWorkoutName] = useState<string>('');  
    const [selectedExercise, setSelectedExercise] = useState<string>('');  
    const [weight, setWeight] = useState<string>('');  
    const [reps, setReps] = useState<string>('');  
    const [sets, setSets] = useState<SetEntry[]>([]);  
    const [editingIndex, setEditingIndex] = useState<number | null>(null);  
    const [error, setError] = useState<string>('');  

    const exercises: string[] = ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Overhead Press'];

    // Reload saved data from localStorage on every navigation change
    useEffect(() => {
        const savedWorkoutName = localStorage.getItem('workoutName');
        const savedSets = localStorage.getItem('sets');

        if (savedWorkoutName) setWorkoutName(savedWorkoutName);
        if (savedSets) {
            try {
                setSets(JSON.parse(savedSets));
            } catch (error) {
                console.error('Failed to parse saved sets:', error);
                setSets([]);
            }
        }
    }, [location.key]); // Reload data whenever the user navigates to this page

    // Save workout name and sets to local storage whenever they change
    useEffect(() => {
        localStorage.setItem('workoutName', workoutName);
        localStorage.setItem('sets', JSON.stringify(sets));
    }, [workoutName, sets]);

    // Add new set
    const handleAddSet = () => {
        if (selectedExercise && weight && reps) {
            const newSet: SetEntry = {
                id: Date.now(),
                exercise: selectedExercise,
                weight: parseFloat(weight),
                reps: parseInt(reps)
            };

            setSets([...sets, newSet]);
            setWeight('');
            setReps('');
            setEditingIndex(null);
            setError('');
        } else {
            setError('Please select an exercise and enter weight and reps.');
        }
    };

    // Edit existing set
    const handleEditSet = (index: number) => {
        const setToEdit = sets[index];
        setSelectedExercise(setToEdit.exercise);
        setWeight(setToEdit.weight.toString());
        setReps(setToEdit.reps.toString());
        setEditingIndex(index);
    };

    // Save edited set
    const handleSaveEdit = () => {
        if (editingIndex !== null && selectedExercise && weight && reps) {
            const updatedSets = [...sets];
            updatedSets[editingIndex] = {
                id: Date.now(),
                exercise: selectedExercise,
                weight: parseFloat(weight),
                reps: parseInt(reps)
            };
            setSets(updatedSets);
            setEditingIndex(null);
            setWeight('');
            setReps('');
        }
    };

    // Delete a set
    const handleDeleteSet = (index: number) => {
        setSets(sets.filter((_, i) => i !== index));
    };

    // Save workout and sets to Supabase
    const handleEndWorkout = async () => {
        if (!workoutName.trim()) {
            alert('Please enter a workout name.');
            return;
        }
        if (sets.length === 0) {
            alert('Please add at least one set.');
            return;
        }

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
            alert('Workout saved successfully!');
            localStorage.removeItem('workoutName');
            localStorage.removeItem('sets');
            navigate('/workouthome');
        }
    };

    // Confirmation and navigation for Back button
    const handleBackButton = () => {
        const confirmLeave = window.confirm("Do you want to save your progress before leaving?");
        
        if (confirmLeave) {
            localStorage.setItem('workoutName', workoutName);
            localStorage.setItem('sets', JSON.stringify(sets));
            alert('Your progress has been saved!');
        } else {
            localStorage.removeItem('workoutName');
            localStorage.removeItem('sets');
            alert('Your progress has been discarded.');
        }
        
        navigate('/workouthome');
    };

    return (
        <div className="free-workout-container">
            <h1>Free Workout</h1>

            <input
                type="text"
                placeholder="Enter Workout Name"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="workout-name-input"
            />

            <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="exercise-dropdown"
            >
                <option value="">Pick exercise</option>
                {exercises.map((exercise, index) => (
                    <option key={index} value={exercise}>{exercise}</option>
                ))}
            </select>

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
                <button onClick={editingIndex !== null ? handleSaveEdit : handleAddSet}>
                    {editingIndex !== null ? "Save Edit" : "Add Set"}
                </button>
            </div>

            <div className="set-list-container">
                <ul className="set-list">
                    {sets.map((set, index) => (
                        <li key={set.id} className="set-item">
                            <span>{set.exercise}</span>
                            <span>{set.weight} lbs</span>
                            <span>{set.reps} reps</span>
                            <button onClick={() => handleEditSet(index)}>Edit</button>
                            <button onClick={() => handleDeleteSet(index)}>Delete</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="fixed-bottom-left">
                <button onClick={handleBackButton}>Back</button>
            </div>
            <div className="fixed-bottom-right">
                <button onClick={handleEndWorkout}>End Workout</button>
            </div>
        </div>
    );
};

export default FreeWorkout;
