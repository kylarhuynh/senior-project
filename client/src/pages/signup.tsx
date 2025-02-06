import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { supabase } from "../lib/supabaseClient"; 

const SignUpPage = () => {
    const navigate = useNavigate(); 
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSignUp = async () => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setMessage(`Signup Error: ${error.message}`);
        } else {
            setMessage("Signup successful! Check your email for confirmation.");
            navigate("/home"); // Redirect after successful signup
        }
    };

    const handleBackButton = () => {
        navigate("/login");  
    };

    return (
        <div className='centeritems'>
            <h1 className='heading'>Welcome to Gyno!</h1>
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
            <button onClick={handleSignUp}>
                Sign Up
            </button>
            <button onClick={handleBackButton} className="fixed-bottom-left">
                Back To Login
            </button>
            {message && <p>{message}</p>}
        </div>
    );
};

export default SignUpPage;
