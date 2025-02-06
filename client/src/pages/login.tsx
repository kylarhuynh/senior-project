import React from 'react';
import { useNavigate } from 'react-router-dom'; // Correct import

const LoginPage = () => {
    const navigate = useNavigate(); // Initialize navigate

    const handleLoginButton = () => {
        navigate('/home');  // Navigate to Home page
    };

    return (
        <div className= 'centeritems'>
            {/* Center content horizontally and vertically */}
            <h1 className='heading'>
                Welcome to Gyno!
            </h1>
            <button onClick={handleLoginButton}>
                Login
            </button>
        </div>
    );
};

export default LoginPage;
