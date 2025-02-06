import React from 'react';
import { useNavigate } from 'react-router-dom'; // Correct import
import '../styles.css';
// import styles from './home.module.css';

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
        <div className="centeritems">
            {/* Center content horizontally and vertically */}
            <h1 className="heading">
                Home Page
            </h1>

            {/* Starter Box for Workouts and Calories */}
            <div style={{
                backgroundColor: '#f3f4f6',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}>
                <h2>Today's Overview</h2>

                {/* List of Workouts */}
                <div>
                    <h3>Workouts for Today</h3>
                    <ul>
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

            <button onClick={handleCaloriesButton}>
                Input Calories
            </button>
            
            <button onClick={handleWorkoutButton}>
                Workout
            </button>

            <div className="fixed-bottom-left">
                <button onClick={handleLogoutButton}>
                    Logout
                </button>
            </div>

        </div>
    );
};

export default HomePage;
