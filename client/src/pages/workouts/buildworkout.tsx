import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles.css';
import './buildworkout.css';

const BuildWorkoutPage = () => {
    const navigate = useNavigate();
    const [selectedExercise, setSelectedExercise] = useState('');
    const [exerciseList, setExerciseList] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null);

    // Example list of exercises
    const exercises = ['Push-up', 'Squat', 'Bench Press', 'Deadlift', 'Pull-up'];

    const handleAddExercise = () => {
        if (selectedExercise) {
            setExerciseList([...exerciseList, selectedExercise]); // Add to list
            setSelectedExercise(''); // Reset selection
        }
    };

    const handleEditExercise = (index: number) => {
        setSelectedExercise(exerciseList[index]); // Pre-fill dropdown with current value
        setEditingIndex(index);
    };

    const handleSaveEdit = () => {
        if (editingIndex !== null && selectedExercise) {
            const updatedList = [...exerciseList];
            updatedList[editingIndex] = selectedExercise;
            setExerciseList(updatedList);
            setEditingIndex(null);
            setSelectedExercise('');
        }
    };

    const handleDeleteExercise = (index: number) => {
        setExerciseList(exerciseList.filter((_, i) => i !== index));
    };

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
                <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Build Workout</h1>

                {/* Exercise Selection */}
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

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button 
                        onClick={editingIndex !== null ? handleSaveEdit : handleAddExercise} 
                        className="add-exercise-btn"
                    >
                        {editingIndex !== null ? "Save Edit" : "Add Exercise"}
                    </button>
                </div>

                {/* Scrollable List of Exercises */}
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

                {/* Buttons */}
                <div className="fixed-bottom-left">
                    <button onClick={handleBackButton}>Cancel</button>
                </div>
                <div className="fixed-bottom-right">
                    <button>Save</button>
                </div>
            </div>
        </div>
    );
};

export default BuildWorkoutPage;
