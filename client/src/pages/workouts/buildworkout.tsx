import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';
import './buildworkout.css';

const normalizeExerciseName = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/gi, '') // removes punctuation AND spaces
      .replace(/s$/, '');         // optional: remove plural 's'
  };
  

const BuildWorkoutPage = () => {
    const navigate = useNavigate();
    const [workoutName, setWorkoutName] = useState('');
    const [selectedExercise, setSelectedExercise] = useState('');
    const [exerciseList, setExerciseList] = useState<string[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [exercises, setExercises] = useState<string[]>([]);

    useEffect(() => {
        const fetchGlobalExercises = async () => {
            const { data, error } = await supabase
                .from('exercises')
                .select('exercise_name')
                .order('exercise_name');

            if (error) {
                console.error("Failed to fetch exercises:", error);
            } else {
                const names = data.map((ex: any) => ex.exercise_name);
                setExercises(names);
            }
        };

        fetchGlobalExercises();
    }, []);

    const handleAddExercise = async () => {
        if (selectedExercise) {
            const normalizedName = normalizeExerciseName(selectedExercise);
            const matchedExercise = exercises.find(
                (e) => normalizeExerciseName(e) === normalizedName
            );

            const nameToUse = matchedExercise || selectedExercise;
            setExerciseList([...exerciseList, nameToUse]);
            setSelectedExercise('');
            setEditingIndex(null);

            if (!matchedExercise) {
                const { data: existing, error: lookupError } = await supabase
                    .from('exercises')
                    .select()
                    .ilike('exercise_name', `%${normalizedName}%`);

                if (!existing || existing.length === 0) {
                    const { error: insertError } = await supabase
                        .from('exercises')
                        .insert([{ exercise_name: selectedExercise }]);

                    if (insertError && insertError.code !== '23505') {
                        console.error("Failed to insert new exercise:", insertError);
                    } else {
                        setExercises(prev => [...prev, selectedExercise]);
                    }
                }
            }
        }
    };

    const handleEditExercise = (index: number) => {
        setSelectedExercise(exerciseList[index]);
        setEditingIndex(index);
    };

    const handleSaveEdit = () => {
        if (editingIndex !== null && selectedExercise) {
            const normalizedName = normalizeExerciseName(selectedExercise);
            const matchedExercise = exercises.find(
                (e) => normalizeExerciseName(e) === normalizedName
            );

            const nameToUse = matchedExercise || selectedExercise;
            const updatedList = [...exerciseList];
            updatedList[editingIndex] = nameToUse;
            setExerciseList(updatedList);
            setEditingIndex(null);
            setSelectedExercise('');
        }
    };

    const handleDeleteExercise = (index: number) => {
        setExerciseList(exerciseList.filter((_, i) => i !== index));
    };

    const handleSaveWorkout = async () => {
        if (!workoutName.trim()) {
            setError('Please enter a workout name.');
            return;
        }
        if (exerciseList.length === 0) {
            setError('Please add at least one exercise.');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('User not logged in.');
            return;
        }

        const { error } = await supabase
            .from('premade_workouts')
            .insert([{ user_id: user.id, name: workoutName, exercises: exerciseList }]);

        if (error) {
            setError(`Error saving workout: ${error.message}`);
        } else {
            alert('Workout saved successfully!');
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
                <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Build Workout</h1>

                <div className="form-container">
                    <input
                        type="text"
                        placeholder="Workout Name"
                        value={workoutName}
                        onChange={(e) => setWorkoutName(e.target.value)}
                        className="workout-name-input"
                    />

                    <input
                        type="text"
                        list="exercise-options"
                        placeholder="Enter or select an exercise"
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                        className="exercise-dropdown"
                    />
                    <datalist id="exercise-options">
                        {exercises.map((exercise, index) => (
                            <option key={index} value={exercise} />
                        ))}
                    </datalist>

                    <button 
                        onClick={editingIndex !== null ? handleSaveEdit : handleAddExercise} 
                        className="add-exercise-btn"
                    >
                        {editingIndex !== null ? "Save Edit" : "Add Exercise"}
                    </button>
                </div>

                <div className="exercise-list-container">
                    {exerciseList.length === 0 ? (
                        <p style={{ fontSize: '14px', color: '#888' }}>No exercises added yet.</p>
                    ) : (
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
                    )}
                </div>

                {error && <p className="error-message">{error}</p>}

                <div className="fixed-bottom-left">
                    <button onClick={() => navigate('/workouthome')}>Cancel</button>
                </div>
                <div className="fixed-bottom-right">
                    <button onClick={handleSaveWorkout}>Save Workout</button>
                </div>
            </div>
        </div>
    );
};

export default BuildWorkoutPage;
