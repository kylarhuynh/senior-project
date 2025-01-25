import React from 'react';
import { useNavigate } from 'react-router-dom'; // Correct import

const LoginPage = () => {
    const navigate = useNavigate(); // Initialize navigate

    const handleLoginButton = () => {
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
                    Welcome to Gyno!
                </h1>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                        onClick={handleLoginButton}
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
