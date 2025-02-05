import React from 'react';
import { useNavigate } from 'react-router-dom'; // Correct import
import '../../styles.css';

const WorkoutHome = () => {
    const navigate = useNavigate(); // Initialize navigate

    const handleBackButton = () => {
        navigate('/home');  // Navigate to Home page
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            // alignItems: 'center', 
            height: '100vh' // Make sure the container takes full viewport height
        }}>
            {/* Center content horizontally and vertically */}
            <div className="text-center p-8 bg-white rounded-lg shadow-lg w-full max-w-md text-red-500">
                <h1 style={{
                    textAlign: 'center', // Center the text horizontally
                    marginBottom: '20px'
                }}>
                    Workout Home
                </h1>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={() => navigate('/buildworkout')}
                    >
                        Build Workout
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={() => navigate('/premadeworkouts')}
                    >
                        Premade Workouts
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={() => navigate('/freeworkout')}
                    >
                        Free Workout
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <button
                        onClick={() => navigate('/pastworkouts')}
                    >
                        View Past Workouts
                    </button>
                </div>
                <div className="fixed-bottom-left">
                    <button
                        onClick={handleBackButton}
                    >
                        Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkoutHome;
