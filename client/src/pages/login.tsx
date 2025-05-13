import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                navigate('/workouthome');
            }
        } catch (error: any) {
            setError(error.message || 'An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                setError('Please check your email for verification link');
            }
        } catch (error: any) {
            setError(error.message || 'An error occurred during sign up');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: 'var(--background-color)',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    color: 'var(--primary-color)',
                    fontSize: '2.5rem',
                    fontWeight: 'bold'
                }}>
                    GymO
                </h1>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                fontSize: '16px',
                                boxSizing: 'border-box'
                            }}
                            required
                        />
                    </div>

                    {error && (
                        <div style={{
                            color: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            padding: '12px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            className="primary-button"
                            style={{ flex: 1, padding: '12px' }}
                        >
                            {loading ? 'Loading...' : 'Login'}
                        </button>
                        <button
                            type="button"
                            onClick={handleSignUp}
                            disabled={loading}
                            className="secondary-button"
                            style={{ flex: 1, padding: '12px' }}
                        >
                            Sign Up
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
