import React, { useState, useEffect, useRef } from 'react';
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

const normalizeExerciseName = (name: string) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/gi, '')
        .replace(/s$/, '');
};

const FreeWorkout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [workoutName, setWorkoutName] = useState('');
    const [selectedExercise, setSelectedExercise] = useState('');
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [sets, setSets] = useState<SetEntry[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [exercises, setExercises] = useState<string[]>([]);

    const hasRestoredSets = useRef(false);

    useEffect(() => {
        const fetchGlobalExercises = async () => {
            const { data, error } = await supabase
                .from('exercises')
                .select('exercise_name')
                .order('exercise_name');

            if (!error && data) {
                setExercises(data.map((ex: any) => ex.exercise_name));
            }
        };

        fetchGlobalExercises();
    }, []);

    useEffect(() => {
        if (hasRestoredSets.current) return;

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
                setSets([]);
            }
        }
    }, [location.key]);

    useEffect(() => {
        localStorage.setItem('workoutName', workoutName);
        localStorage.setItem('sets', JSON.stringify(sets));
    }, [workoutName, sets]);

    useEffect(() => {
        const fetchLastSet = async () => {
            setWeight('');
            setReps('');

            if (!selectedExercise.trim()) return;

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('completed_sets')
                .select('weight, reps, completed_workout:completed_workouts(user_id)')
                .eq('exercise_name', selectedExercise)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && Array.isArray(data)) {
                const lastMatch = (data as any[]).find((d) =>
                    Array.isArray(d.completed_workout)
                        ? d.completed_workout.some((cw) => cw.user_id === user.id)
                        : d.completed_workout?.user_id === user.id
                );

                if (lastMatch) {
                    setWeight(lastMatch.weight.toString());
                    setReps(lastMatch.reps.toString());
                }
            }
        };

        fetchLastSet();
    }, [selectedExercise]);

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

            // Check for personal best
            const previousSets = await supabase
                .from('completed_sets')
                .select('weight, reps')
                .eq('exercise_name', newSet.exercise)
                .order('created_at', { ascending: false });

            if (previousSets.data && Array.isArray(previousSets.data)) {
                const isWeightPR = previousSets.data.every(s => newSet.weight > s.weight);
                const isRepsPR = previousSets.data
                    .filter(s => s.weight === newSet.weight)
                    .every(s => newSet.reps > s.reps);

                if (isWeightPR) alert('🎉 New personal record: highest weight!');
                else if (isRepsPR) alert('🔥 New personal record: most reps at this weight!');
            }

            setSets([...sets, newSet]);
            setEditingIndex(null);
            setError('');

            if (!matchedExercise) {
                const { data: existing, error: lookupError } = await supabase
                    .from('exercises')
                    .select()
                    .ilike('exercise_name', `%${normalizedName}%`);

                if (!existing || existing.length === 0) {
                    await supabase.from('exercises').insert([{ exercise_name: selectedExercise }]);
                    setExercises(prev => [...prev, selectedExercise]);
                }
            }
        } else {
            setError('Please select an exercise and enter weight and reps.');
        }
    };

    const handleEditSet = (index: number) => {
        const setToEdit = sets[index];
        setSelectedExercise(setToEdit.exercise);
        setWeight(setToEdit.weight.toString());
        setReps(setToEdit.reps.toString());
        setEditingIndex(index);
    };

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
            setSelectedExercise('');
            setWeight('');
            setReps('');
        }
    };

    const handleDeleteSet = (index: number) => {
        setSets(sets.filter((_, i) => i !== index));
    };

    const handleEndWorkout = async () => {
        if (!workoutName.trim()) return alert('Please enter a workout name.');
        if (sets.length === 0) return alert('Please add at least one set.');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert('User not logged in.');

        const { data, error } = await supabase
            .from('completed_workouts')
            .insert([{ user_id: user.id, workout_name: workoutName }])
            .select();

        if (error) return alert('Failed to save workout.');

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
            alert('Failed to save sets.');
        } else {
            alert('Workout saved successfully!');
            localStorage.removeItem('workoutName');
            localStorage.removeItem('sets');
            navigate('/workouthome');
        }
    };

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

            {error && <p className="error-message">{error}</p>}

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
