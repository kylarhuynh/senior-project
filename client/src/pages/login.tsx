import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'; // Correct import
import { supabase } from "../lib/supabaseClient"; 


const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false); // To track error visibility
    const [message, setMessage] = useState("");

    const navigate = useNavigate(); // Initialize navigate

    const handleLoginButton = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setError(true); // Set error to true to show the error message
            setMessage(error.message); // Set the error message
        } else {
            setError(false); // No error, so hide the message
            setMessage("Login successful!");
            navigate("/home"); // Redirect to home page
        }
    };

    const handleSignUpButton = () => {
        navigate('/signup');  // Navigate to Home page
    };



    return (
        <div className= 'centeritems'>
            {/* Center content horizontally and vertically */}
            <h1 className='heading'>
                Welcome to Gyno!
            </h1>
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="error-message">{message}</p>}
            <button onClick={handleLoginButton}>
                Login
            </button>
            <button onClick={handleSignUpButton}>
                Sign Up
            </button>
        </div>
    );
};

export default LoginPage;
