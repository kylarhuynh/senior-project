import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';
import './buildworkout.css';

// Define TypeScript types
type Workout = {
    id: string;
    name: string;
    exercises: string[];
};

const EditWorkoutPage: React.FC = () => {
    const { workoutId } = useParams<{ workoutId: string }>(); // Get workoutId from URL
    const navigate = useNavigate();
    const [workoutName, setWorkoutName] = useState<string>('');
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [exerciseList, setExerciseList] = useState<string[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [error, setError] = useState<string>('');

    // Example list of exercises
    const exercises: string[] = ['Push-up', 'Squat', 'Bench Press', 'Deadlift', 'Pull-up'];

    // Fetch the workout details on component mount
    useEffect(() => {
        const fetchWorkout = async () => {
            if (!workoutId) return;

            const { data, error } = await supabase
                .from('premade_workouts')
                .select('*')
                .eq('id', workoutId)
                .single();

            if (error) {
                console.error("Failed to fetch workout:", error);
                setError('Failed to load workout.');
            } else if (data) {
                setWorkoutName(data.name);
                setExerciseList(data.exercises);
            }
        };

        fetchWorkout();
    }, [workoutId]);

    // Handle adding a new exercise
    const handleAddExercise = () => {
        if (selectedExercise) {
            setExerciseList([...exerciseList, selectedExercise]);
            setSelectedExercise('');
        }
    };

    // Handle editing an existing exercise
    const handleEditExercise = (index: number) => {
        setSelectedExercise(exerciseList[index]);
        setEditingIndex(index);
    };

    // Save the edited exercise
    const handleSaveEdit = () => {
        if (editingIndex !== null && selectedExercise) {
            const updatedList = [...exerciseList];
            updatedList[editingIndex] = selectedExercise;
            setExerciseList(updatedList);
            setEditingIndex(null);
            setSelectedExercise('');
        }
    };

    // Handle deleting an exercise
    const handleDeleteExercise = (index: number) => {
        setExerciseList(exerciseList.filter((_, i) => i !== index));
    };

    // Save the updated workout
    const handleSaveWorkout = async () => {
        if (!workoutName.trim()) {
            setError('Please enter a workout name.');
            return;
        }
        if (exerciseList.length === 0) {
            setError('Please add at least one exercise.');
            return;
        }

        const { error } = await supabase
            .from('premade_workouts')
            .update({ name: workoutName, exercises: exerciseList })
            .eq('id', workoutId);

        if (error) {
            setError(`Error updating workout: ${error.message}`);
            console.error("Supabase Update Error:", error);
        } else {
            alert('Workout updated successfully!');
            navigate('/premadeworkouts');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            height: '100vh'
        }}>
            <div className="text-center p-8 bg-white rounded-lg shadow-lg w-full max-w-md">
                <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Edit Workout</h1>

                <div className="form-container">
                    <input
                        type="text"
                        placeholder="Workout Name"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        className="workout-name-input"
                    />

                    <select
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="exercise-dropdown"
                    >
                        <option value="">Select an Exercise</option>
                        {exercises.map((exercise, index) => (
                            <option key={index} value={exercise}>{exercise}</option>
                        ))}
                    </select>

                    <button 
                        onClick={editingIndex !== null ? handleSaveEdit : handleAddExercise} 
                        className="add-exercise-btn"
                    >
                        {editingIndex !== null ? "Save Edit" : "Add Exercise"}
                    </button>
                </div>

                <div className="exercise-list-container">
                    <ul className="exercise-list">
                        {exerciseList.map((exercise, index) => (
                            <li key={index} className="exercise-item">
                                {exercise}
                                <div className="exercise-buttons">
                                    <button onClick={() => handleEditExercise(index)} className="edit-btn">Edit</button>
                                    <button onClick={() => handleDeleteExercise(index)} className="delete-btn">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {error && <p className="error-message">{error}</p>}

                <div className="fixed-bottom-left">
                    <button onClick={() => navigate('/premadeworkouts')}>Cancel</button>
                </div>
                <div className="fixed-bottom-right">
                    <button onClick={handleSaveWorkout}>Save Workout</button>
                </div>
            </div>
        </div>
    );
};

export default EditWorkoutPage;
