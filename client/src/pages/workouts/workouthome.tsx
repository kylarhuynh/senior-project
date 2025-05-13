import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles.css';

const WorkoutHome = () => {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            {/* Workout Options */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div className="content-card">
                    <h3 className="section-header">Quick Start</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="primary-button" onClick={() => navigate('/workout-creator')}>
                            Record Workout
                        </button>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Start a new workout session
                        </p>
                    </div>
                </div>

                <div className="content-card">
                    <h3 className="section-header">Workout Plans</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="secondary-button" onClick={() => navigate('/templates')}>
                            Browse Templates
                        </button>
                        <button className="secondary-button" onClick={() => navigate('/workout-creator', { state: { isTemplate: true } })}>
                            Create Template
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Feed Preview */}
            <div className="content-card" style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="section-header" style={{ margin: 0 }}>Recent Activity</h3>
                    <button className="secondary-button" onClick={() => navigate('/activity-feed')}>
                        View All
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Your Workout History</div>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Track your progress and view past workouts
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutHome;
