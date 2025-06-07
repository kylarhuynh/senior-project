import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import mapboxgl from 'mapbox-gl';
import '../../styles.css';

type SetEntry = {
    id: number;
    exercise: string;
    weight: number;
    reps: number;
};

type TemplateEntry = {
    id: number;
    exercise: string;
};

type LocationData = {
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
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

const isSetEntry = (set: SetEntry | TemplateEntry): set is SetEntry => {
    return 'weight' in set && 'reps' in set;
};

const WorkoutCreator: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [workoutName, setWorkoutName] = useState<string>('');
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [reps, setReps] = useState<string>('');
    const [sets, setSets] = useState<(SetEntry | TemplateEntry)[]>([]);
    const [exercises, setExercises] = useState<string[]>([]);
    const [isTemplate, setIsTemplate] = useState<boolean>(location.state?.isTemplate || false);
    const [error, setError] = useState<string>('');
    const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
    const hasRestoredSets = useRef(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number>(0);
    const [templateExercises, setTemplateExercises] = useState<string[]>([]);

    // Function to fetch last used weight and reps for an exercise
    const fetchLastUsedValues = async (exerciseName: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            // First get the user's most recent workout
            const { data: workoutData, error: workoutError } = await supabase
                .from('completed_workouts')
                .select('id')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // If no workout found or error, just clear the fields
            if (workoutError || !workoutData) {
                setWeight('');
                setReps('');
                return;
            }

            // Then get the most recent set for this exercise from that workout
            const { data, error } = await supabase
                .from('completed_sets')
                .select('weight, reps')
                .eq('completed_workout_id', workoutData.id)
                .eq('exercise_name', exerciseName)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // If no set found or error, just clear the fields
            if (error || !data) {
                setWeight('');
                setReps('');
                return;
            }

            // If we found data, set the values
            setWeight(data.weight.toString());
            setReps(data.reps.toString());
        } catch (error) {
            // If any unexpected error occurs, just clear the fields
            setWeight('');
            setReps('');
        }
    };

    // Handle template data if it exists
    useEffect(() => {
        if (location.state?.template) {
            const { name, exercises } = location.state.template;
            setWorkoutName(name);
            setTemplateExercises(exercises.map((ex: any) => ex.exercise));
            setSelectedExercise(exercises[0].exercise);
            fetchLastUsedValues(exercises[0].exercise);
        }
    }, [location.state]);

    // Fetch last used values when exercise changes
    useEffect(() => {
        if (selectedExercise && !isTemplate) {
            fetchLastUsedValues(selectedExercise);
        }
    }, [selectedExercise, isTemplate]);

    // Function to get location data from coordinates
    const getLocationData = async (latitude: number, longitude: number): Promise<LocationData> => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                const place = data.features[0];
                const context = place.context || [];
                
                // Extract city, state, and country from the context
                const city = place.text || 'Unknown City';
                const state = context.find((c: any) => c.id.startsWith('region'))?.text || 'Unknown State';
                const country = context.find((c: any) => c.id.startsWith('country'))?.text || 'Unknown Country';
                
                return {
                    city,
                    state,
                    country,
                    latitude,
                    longitude
                };
            }
            // Return default values if no location data found
            return {
                city: 'Unknown City',
                state: 'Unknown State',
                country: 'Unknown Country',
                latitude,
                longitude
            };
        } catch (error) {
            console.error('Error getting location data:', error);
            // Return default values on error
            return {
                city: 'Unknown City',
                state: 'Unknown State',
                country: 'Unknown Country',
                latitude,
                longitude
            };
        }
    };

    // Function to get current location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const locationData = await getLocationData(
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    setCurrentLocation(locationData);
                } catch (error) {
                    console.error('Error getting location data:', error);
                    setError('Failed to get location data');
                }
            },
            (error) => {
                console.error('Error getting location:', error);
                setError('Failed to get your location');
            }
        );
    };

    useEffect(() => {
        getCurrentLocation();
    }, []);

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
        if (!isTemplate && !hasRestoredSets.current && !location.state?.template) {
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
    }, [isTemplate, location.key, location.state]);

    const handleAddSet = async () => {
        if (!selectedExercise) {
            setError('Please select an exercise');
            return;
        }

        if (!isTemplate && (!weight || !reps)) {
            setError('Please fill in all fields');
            return;
        }

        const normalizedName = normalizeExerciseName(selectedExercise);
        const matchedExercise = exercises.find(
            (e) => normalizeExerciseName(e) === normalizedName
        );

        const exerciseName = matchedExercise || selectedExercise;

        if (isTemplate) {
            const newTemplateEntry: TemplateEntry = {
                id: Date.now(),
                exercise: exerciseName,
            };
            setSets(prev => [...prev, newTemplateEntry]);
        } else {
            const newSet: SetEntry = {
                id: Date.now(),
                exercise: exerciseName,
                weight: parseFloat(weight),
                reps: parseInt(reps)
            };

            // Get past sets from database
            const { data: pastData, error: fetchError } = await supabase
                .from('completed_sets')
                .select('weight, reps')
                .eq('exercise_name', exerciseName)
                .order('created_at', { ascending: false });

            if (fetchError) console.error('Error fetching sets:', fetchError);

            // Combine past and current session sets
            const currentSessionSets = sets.filter(s => 'weight' in s && normalizeExerciseName(s.exercise) === normalizedName) as SetEntry[];
            const allSets = [...(pastData || []), ...currentSessionSets];

            // Check for PR
            const isWeightPR = allSets.every(s => newSet.weight > s.weight);
            const isRepsPR = allSets
                .filter(s => s.weight === newSet.weight)
                .every(s => newSet.reps > s.reps);

            if (isWeightPR) {
                alert('🎉 New personal record: highest weight!');
            } else if (isRepsPR) {
                alert('🔥 New personal record: most reps at this weight!');
            }

            setSets(prev => [...prev, newSet]);
        }

        // Only clear error message
        setError('');

        // Insert new exercise if not in list
        if (!matchedExercise) {
            const { error: insertError } = await supabase
                .from('exercises')
                .insert([{ exercise_name: selectedExercise }]);

            if (!insertError || insertError.code === '23505') {
                setExercises(prev => [...prev, selectedExercise]);
            }
        }
    };

    const handleDeleteSet = (index: number) => {
        setSets(sets.filter((_, i) => i !== index));
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < templateExercises.length - 1) {
            setCurrentExerciseIndex(currentExerciseIndex + 1);
            setSelectedExercise(templateExercises[currentExerciseIndex + 1]);
        }
    };

    const handlePreviousExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(currentExerciseIndex - 1);
            setSelectedExercise(templateExercises[currentExerciseIndex - 1]);
        }
    };

    const handleFinishWorkout = async () => {
        try {
            await handleSaveWorkout();
            navigate('/activity-feed');
        } catch (error) {
            console.error('Error finishing workout:', error);
            setError(error instanceof Error ? error.message : 'Failed to finish workout');
        }
    };

    const handleSaveWorkout = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            if (isTemplate) {
                // Save template to premade_workouts table
                const { error: templateError } = await supabase
                    .from('premade_workouts')
                    .insert([{
                        user_id: user.id,
                        name: workoutName,
                        exercises: sets.map(set => set.exercise)
                    }]);

                if (templateError) {
                    console.error('Template save error:', templateError);
                    throw new Error(`Failed to save template: ${templateError.message}`);
                }

                // Navigate to templates page
                navigate('/templates');
                return;
            }

            // Get location data
            let locationId = null;
            if (currentLocation) {
                const { data: locationData, error: locationError } = await supabase
                    .from('locations')
                    .insert([{
                        city: currentLocation.city || 'Unknown City',
                        state: currentLocation.state || 'Unknown State',
                        country: currentLocation.country || 'Unknown Country',
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude
                    }])
                    .select()
                    .single();

                if (locationError) {
                    console.error('Location save error:', locationError);
                    throw new Error(`Failed to save location: ${locationError.message}`);
                }
                locationId = locationData.id;
            }

            // Then save the workout
            console.log('Saving workout:', { workoutName, locationId });
            const { data: workoutData, error: workoutError } = await supabase
                .from('completed_workouts')
                .insert([{
                    user_id: user.id,
                    workout_name: workoutName,
                    location_id: locationId
                }])
                .select()
                .single();

            if (workoutError) {
                console.error('Workout save error:', workoutError);
                throw new Error(`Failed to save workout: ${workoutError.message}`);
            }
            console.log('Workout saved with ID:', workoutData.id);

            // Save the sets
            const setEntries = sets.map((set, index) => ({
                completed_workout_id: workoutData.id,
                exercise_name: set.exercise,
                weight: 'weight' in set ? set.weight : null,
                reps: 'weight' in set ? set.reps : null,
                set_number: index + 1
            }));
            console.log('Saving sets:', setEntries);

            const { error: setsError } = await supabase
                .from('completed_sets')
                .insert(setEntries);

            if (setsError) {
                console.error('Sets save error:', setsError);
                throw new Error(`Failed to save sets: ${setsError.message}`);
            }
            console.log('Sets saved successfully');

            // Clear local storage
            localStorage.removeItem('workoutName');
            localStorage.removeItem('sets');

            navigate('/workouthome');
        } catch (error) {
            console.error('Error saving workout:', error);
            setError(error instanceof Error ? error.message : 'Failed to save workout');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <div className="content-card">
                <h2 style={{ marginBottom: '16px' }}>{isTemplate ? 'Create Template' : 'Create Workout'}</h2>
                
                {currentLocation && (
                    <div style={{ 
                        marginBottom: '16px', 
                        padding: '12px',
                        backgroundColor: 'var(--background-color)',
                        borderRadius: '4px'
                    }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Current Location</div>
                        <div style={{ fontSize: '16px' }}>
                            {currentLocation.city}, {currentLocation.state}, {currentLocation.country}
                        </div>
                    </div>
                )}

                {/* Mode Toggle - Only show if not using a template */}
                {!location.state?.template && (
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
                )}

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
                    <h3 className="section-header" style={{ fontSize: '18px', marginBottom: '12px' }}>
                        {isTemplate ? 'Add Exercise to Template' : 'Add Exercise'}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {!location.state?.template ? (
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    list="exercise-categories"
                                    placeholder="Select or type an exercise"
                                    value={selectedExercise}
                                    onChange={(e) => {
                                        setSelectedExercise(e.target.value);
                                        if (e.target.value) {
                                            fetchLastUsedValues(e.target.value);
                                        }
                                    }}
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
                        ) : (
                            <div style={{ 
                                padding: '12px',
                                backgroundColor: 'var(--background-color)',
                                borderRadius: '4px',
                                fontSize: '18px',
                                fontWeight: 500
                            }}>
                                {selectedExercise}
                            </div>
                        )}
                        {!isTemplate && (
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
                        )}
                        <button
                            className="primary-button"
                            onClick={handleAddSet}
                            style={{ padding: '12px' }}
                        >
                            {isTemplate ? 'Add Exercise' : 'Add Set'}
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

                {/* Sets/Exercises List */}
                {sets.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <h3 className="section-header" style={{ fontSize: '18px', marginBottom: '12px' }}>
                            {isTemplate ? `Exercises (${sets.length})` : `Sets (${sets.length})`}
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
                                        gridTemplateColumns: isTemplate ? '24px 1fr auto' : '24px 1fr auto auto auto',
                                        gap: '12px',
                                        padding: '12px',
                                        borderBottom: index < sets.length - 1 ? '1px solid var(--border-color)' : 'none',
                                        alignItems: 'center',
                                        background: index % 2 === 0 ? 'var(--background-color)' : 'white'
                                    }}
                                >
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{index + 1}</span>
                                    <span style={{ fontWeight: 500 }}>{set.exercise}</span>
                                    {!isTemplate && isSetEntry(set) && (
                                        <>
                                            <span style={{ color: 'var(--text-secondary)' }}>{set.weight} lbs</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{set.reps} reps</span>
                                        </>
                                    )}
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

                {/* Navigation Buttons for Template Workout */}
                {location.state?.template && (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '20px', 
                        marginTop: '20px',
                        marginBottom: '20px'
                    }}>
                        <button 
                            className="secondary-button"
                            onClick={handlePreviousExercise} 
                            disabled={currentExerciseIndex === 0}
                            style={{
                                opacity: currentExerciseIndex === 0 ? 0.5 : 1,
                                cursor: currentExerciseIndex === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Previous Exercise
                        </button>
                        <button 
                            className="primary-button"
                            onClick={currentExerciseIndex < templateExercises.length - 1 ? handleNextExercise : handleFinishWorkout}
                        >
                            {currentExerciseIndex < templateExercises.length - 1 ? "Next Exercise" : "Finish Workout"}
                        </button>
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
                    {!location.state?.template && (
                        <button
                            className="primary-button"
                            onClick={handleSaveWorkout}
                        >
                            {isTemplate ? 'Save Template' : 'Complete Workout'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkoutCreator; 