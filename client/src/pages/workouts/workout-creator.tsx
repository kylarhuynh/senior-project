import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';

type SetEntry = {
    id: number;
    exercise: string;
    weight: number;
    reps: number;
};

// Common exercises grouped by category
const COMMON_EXERCISES = {
    "Chest": [
        "Bench Press",
        "Incline Bench Press",
        "Dumbbell Press",
        "Push-Ups",
        "Chest Flyes"
    ],
    "Back": [
        "Pull-Ups",
        "Lat Pulldown",
        "Barbell Row",
        "Dumbbell Row",
        "Deadlift"
    ],
    "Legs": [
        "Squats",
        "Leg Press",
        "Lunges",
        "Leg Extensions",
        "Calf Raises"
    ],
    "Shoulders": [
        "Overhead Press",
        "Lateral Raises",
        "Front Raises",
        "Face Pulls",
        "Shrugs"
    ],
    "Arms": [
        "Bicep Curls",
        "Tricep Extensions",
        "Hammer Curls",
        "Skull Crushers",
        "Chin-Ups"
    ],
    "Core": [
        "Crunches",
        "Planks",
        "Russian Twists",
        "Leg Raises",
        "Ab Wheel Rollouts"
    ]
};

const normalizeExerciseName = (name: string) => {
    return name.toLowerCase().trim().replace(/[^a-z0-9]/gi, '').replace(/s$/, '');
};

const WorkoutCreator: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [workoutName, setWorkoutName] = useState<string>('');
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [reps, setReps] = useState<string>('');
    const [sets, setSets] = useState<SetEntry[]>([]);
    const [exercises, setExercises] = useState<string[]>([]);
    const [isTemplate, setIsTemplate] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const hasRestoredSets = useRef(false);

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

    useEffect(() => {
        if (!isTemplate && !hasRestoredSets.current) {
            const savedWorkoutName = localStorage.getItem('workoutName');
            const savedSets = localStorage.getItem('sets');
            if (savedWorkoutName) setWorkoutName(savedWorkoutName);

            if (savedSets) {
                try {
                    const parsedSets = JSON.parse(savedSets);
                    if (Array.isArray(parsedSets)) {
                        const restoredSets: SetEntry[] = parsedSets.map((set: any, i: number) => ({
                            id: Date.now() + i,
                            exercise: set.exercise,
                            weight: parseFloat(set.weight),
                            reps: parseInt(set.reps)
                        }));
                        setSets(restoredSets);
                        hasRestoredSets.current = true;
                    }
                } catch (error) {
                    console.error('Failed to parse saved sets:', error);
                }
            }
        }
    }, [isTemplate, location.key]);

    const handleAddSet = async () => {
        if (selectedExercise && weight && reps) {
            const normalizedName = normalizeExerciseName(selectedExercise);
            const matchedExercise = exercises.find(
                (e) => normalizeExerciseName(e) === normalizedName
            );

            const newSet: SetEntry = {
                id: Date.now(),
                exercise: matchedExercise || selectedExercise,
                weight: parseFloat(weight),
                reps: parseInt(reps)
            };

            setSets([...sets, newSet]);
            setWeight('');
            setReps('');
            setError('');

            if (!matchedExercise) {
                const { error: insertError } = await supabase
                    .from('exercises')
                    .insert([{ exercise_name: selectedExercise }]);

                if (!insertError || insertError.code === '23505') {
                    setExercises(prev => [...prev, selectedExercise]);
                }
            }
        } else {
            setError('Please fill in all fields');
        }
    };

    const handleDeleteSet = (index: number) => {
        setSets(sets.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!workoutName.trim()) {
            setError('Please enter a workout name');
            return;
        }
        if (sets.length === 0) {
            setError('Please add at least one set');
            return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('User not logged in');
            return;
        }

        if (isTemplate) {
            // Save as template
            const { error } = await supabase
                .from('premade_workouts')
                .insert([{
                    user_id: user.id,
                    name: workoutName,
                    exercises: sets.map(set => ({
                        exercise: set.exercise,
                        weight: set.weight,
                        reps: set.reps
                    }))
                }]);

            if (error) {
                setError('Failed to save template');
                return;
            }
        } else {
            // Save as completed workout
            const { data, error } = await supabase
                .from('completed_workouts')
                .insert([{ user_id: user.id, workout_name: workoutName }])
                .select();

            if (error || !data) {
                setError('Failed to save workout');
                return;
            }

            const workoutId = data[0].id;
            const setsData = sets.map((set, index) => ({
                completed_workout_id: workoutId,
                exercise_name: set.exercise,
                set_number: index + 1,
                weight: set.weight,
                reps: set.reps
            }));

            const { error: setsError } = await supabase
                .from('completed_sets')
                .insert(setsData);

            if (setsError) {
                setError('Failed to save sets');
                return;
            }

            localStorage.removeItem('workoutName');
            localStorage.removeItem('sets');
        }

        navigate(isTemplate ? '/templates' : '/activity-feed');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <div className="content-card">
                {/* Mode Toggle */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '12px', 
                    marginBottom: '24px',
                    padding: '8px',
                    background: 'var(--background-color)',
                    borderRadius: '8px'
                }}>
                    <button 
                        className={!isTemplate ? "primary-button" : "secondary-button"} 
                        onClick={() => setIsTemplate(false)}
                        style={{ flex: 1, maxWidth: '200px' }}
                    >
                        Record Workout
                    </button>
                    <button 
                        className={isTemplate ? "primary-button" : "secondary-button"} 
                        onClick={() => setIsTemplate(true)}
                        style={{ flex: 1, maxWidth: '200px' }}
                    >
                        Create Template
                    </button>
                </div>

                {/* Workout Name */}
                <input
                    type="text"
                    placeholder={isTemplate ? "Template Name" : "Workout Name"}
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '18px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        marginBottom: '24px',
                        boxSizing: 'border-box'
                    }}
                />

                {/* Add Exercise Section */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 className="section-header" style={{ fontSize: '18px', marginBottom: '12px' }}>Add Exercise</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                list="exercise-categories"
                                placeholder="Select or type an exercise"
                                value={selectedExercise}
                                onChange={(e) => setSelectedExercise(e.target.value)}
                                style={{ 
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-color)',
                                    fontSize: '16px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <datalist id="exercise-categories">
                                {Object.entries(COMMON_EXERCISES).map(([category, exercises]) => (
                                    exercises.map((exercise) => (
                                        <option key={`${category}-${exercise}`} value={exercise}>
                                            {`${exercise} (${category})`}
                                        </option>
                                    ))
                                ))}
                                {exercises.map((exercise) => (
                                    <option key={exercise} value={exercise} />
                                ))}
                            </datalist>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input
                                type="number"
                                placeholder="Weight (lbs)"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                style={{ 
                                    padding: '12px', 
                                    borderRadius: '4px', 
                                    border: '1px solid var(--border-color)',
                                    fontSize: '16px'
                                }}
                            />
                            <input
                                type="number"
                                placeholder="Reps"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                style={{ 
                                    padding: '12px', 
                                    borderRadius: '4px', 
                                    border: '1px solid var(--border-color)',
                                    fontSize: '16px'
                                }}
                            />
                        </div>
                        <button 
                            className="primary-button" 
                            onClick={handleAddSet}
                            style={{ padding: '12px' }}
                        >
                            Add Set
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ 
                        color: '#e74c3c', 
                        marginBottom: '20px', 
                        fontSize: '14px',
                        padding: '12px',
                        background: 'rgba(231, 76, 60, 0.1)',
                        borderRadius: '4px'
                    }}>
                        {error}
                    </div>
                )}

                {/* Sets List */}
                {sets.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h3 className="section-header" style={{ fontSize: '18px', marginBottom: '12px' }}>
                            Sets ({sets.length})
                        </h3>
                        <div style={{ 
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            {sets.map((set, index) => (
                                <div 
                                    key={set.id}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '24px 1fr auto auto auto',
                                        gap: '12px',
                                        padding: '12px',
                                        borderBottom: index < sets.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        alignItems: 'center',
                                        background: index % 2 === 0 ? 'var(--background-color)' : 'white'
                                    }}
                                >
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{index + 1}</span>
                                    <span style={{ fontWeight: 500 }}>{set.exercise}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{set.weight} lbs</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>{set.reps} reps</span>
                                    <button 
                                        onClick={() => handleDeleteSet(index)}
                                        style={{
                                            padding: '4px 8px',
                                            color: '#e74c3c',
                                            border: 'none',
                                            background: 'none',
                                            cursor: 'pointer',
                                            opacity: 0.7
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                    <button 
                        className="secondary-button"
                        onClick={() => navigate('/workouthome')}
                    >
                        Cancel
                    </button>
                    <button 
                        className="primary-button"
                        onClick={handleSave}
                    >
                        {isTemplate ? 'Save Template' : 'Complete Workout'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkoutCreator; 