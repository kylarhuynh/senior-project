import React from 'react';
import { useNavigate } from 'react-router-dom'; // Correct import
import '../../styles.css';

const PremadeWorkoutsPage = () => {
    const navigate = useNavigate(); // Initialize navigate

    const handleBackButton = () => {
        navigate('/workouthome');  // Navigate to workout home page
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
                    Premade Workouts
                </h1>
                <body style={{
                    textAlign: 'center', // Center the text horizontally
                    marginBottom: '20px'
                }}>
                    Select Premade Workout
                </body>
            </div>
            <div className="fixed-bottom-left">
                <button onClick={handleBackButton}>Back</button>
            </div>
        </div>
    );
};

export default PremadeWorkoutsPage;
