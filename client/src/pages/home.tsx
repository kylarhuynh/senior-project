import React from 'react';
import { useNavigate } from 'react-router-dom'; // Correct import
import '../styles.css';

const HomePage = () => {
    const navigate = useNavigate(); // Initialize navigate

    const handleWorkoutButton = () => {
        navigate('/workouthome');  // Navigate to Home page
    };

    const handleCaloriesButton = () => {
        navigate('/calorieshome');  // Navigate to Home page
    };

    const handleLogoutButton = () => {
        navigate('/login');  // Navigate to Home page
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            // alignItems: 'center', 
            height: '100vh' // Make sure the container takes full viewport height
        }}>
            {/* Center content horizontally and vertically */}
            <div className="text-center p-8 bg-white rounded-lg shadow-lg w-full max-w-md">
                <h1 style={{
                    textAlign: 'center', // Center the text horizontally
                    marginBottom: '20px'
                }}>
                    Home Page
                </h1>

                {/* Starter Box for Workouts and Calories */}
                <div style={{
                    backgroundColor: '#f3f4f6',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    marginBottom: '20px'
                }}>
                    <h2 style={{ marginBottom: '10px' }}>Today's Overview</h2>

                    {/* List of Workouts */}
                    <div style={{ marginBottom: '15px' }}>
                        <h3>Workouts for Today</h3>
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            <li>Push-ups - 3 sets of 15 reps</li>
                            <li>Squats - 3 sets of 20 reps</li>
                            <li>Jogging - 30 minutes</li>
                        </ul>
                    </div>

                    {/* Calories Left */}
                    <div>
                        <h3>Calories Left</h3>
                        <p>You have <strong>450</strong> calories left for the day!</p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={handleCaloriesButton}
                    >
                        Input Calories
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={handleWorkoutButton}
                    >
                        Workout
                    </button>
                </div>
                <div className="fixed-bottom-left">
                    <button
                        onClick={handleLogoutButton}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
