import React from 'react';
import { useNavigate } from 'react-router-dom'; // Correct import

const WorkoutsHome = () => {
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
            <div className="text-center p-8 bg-white rounded-lg shadow-lg w-full max-w-md">
                <h1 style={{
                    textAlign: 'center', // Center the text horizontally
                    marginBottom: '20px'
                }}>
                    Workouts Home
                </h1>
                <p style={{
                    textAlign: 'center', // Center the text horizontally
                    marginBottom: '20px'
                }}>Insert stuff</p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={handleBackButton}
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorkoutsHome;
