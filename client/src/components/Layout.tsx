import React from 'react';
import { useNavigate, Link, useLocation, Outlet } from 'react-router-dom';
import '../styles.css';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="page-container">
            {/* Navigation */}
            <nav className="top-nav">
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Link to="/home" style={{ textDecoration: 'none' }}>
                        <h1 style={{ color: 'var(--primary-color)', fontSize: '24px', fontWeight: 'bold' }}>
                            GymO
                        </h1>
                    </Link>
                    <button 
                        className={`secondary-button ${location.pathname.includes('/workout') ? 'active' : ''}`} 
                        onClick={() => navigate('/workouthome')}
                    >
                        Training
                    </button>
                    <button 
                        className={`secondary-button ${location.pathname.includes('/calories') ? 'active' : ''}`} 
                        onClick={() => navigate('/calorieshome')}
                    >
                        Nutrition
                    </button>
                    <button 
                        className={`secondary-button ${location.pathname === '/map' ? 'active' : ''}`} 
                        onClick={() => navigate('/map')}
                    >
                        Map
                    </button>
                </div>
                <button className="secondary-button" onClick={() => navigate('/login')}>
                    Logout
                </button>
            </nav>

            {/* Main Content */}
            <Outlet />
        </div>
    );
};

export default Layout; 