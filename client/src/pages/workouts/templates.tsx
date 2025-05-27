import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';

type WorkoutTemplate = {
    id: string;
    name: string;
    exercises: string[];
    created_at: string;
};

const Templates: React.FC = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError('User not logged in');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('premade_workouts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching templates:', error);
            setError('Failed to load templates');
            setLoading(false);
            return;
        }

        console.log('Fetched templates:', data);
        setTemplates(data);
        setLoading(false);
    };

    const handleUseTemplate = async (template: WorkoutTemplate) => {
        navigate('/workout-creator', { 
            state: { 
                template: {
                    name: template.name,
                    exercises: template.exercises.map(exercise => ({
                        exercise: exercise,
                        weight: 0,  // Default weight
                        reps: 0     // Default reps
                    }))
                }
            }
        });
    };

    const handleDeleteTemplate = async (templateId: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this template?');
        if (!confirmed) return;

        const { error } = await supabase
            .from('premade_workouts')
            .delete()
            .eq('id', templateId);

        if (error) {
            console.error('Error deleting template:', error);
            setError('Failed to delete template');
        } else {
            setTemplates(templates.filter(t => t.id !== templateId));
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            {loading ? (
                <div className="content-card" style={{ textAlign: 'center', padding: '40px' }}>
                    Loading...
                </div>
            ) : error ? (
                <div className="content-card" style={{ color: '#e74c3c', padding: '20px' }}>
                    {error}
                </div>
            ) : templates.length === 0 ? (
                <div className="content-card" style={{ textAlign: 'center', padding: '40px' }}>
                    <h3 style={{ marginBottom: '16px' }}>No templates yet</h3>
                    <button 
                        className="primary-button"
                        onClick={() => navigate('/workout-creator', { state: { isTemplate: true } })}
                    >
                        Create Your First Template
                    </button>
                </div>
            ) : (
                templates.map((template) => (
                    <div key={template.id} className="content-card">
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '16px'
                        }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>
                                {template.name}
                            </h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    className="primary-button"
                                    onClick={() => handleUseTemplate(template)}
                                >
                                    Use Template
                                </button>
                                <button 
                                    style={{
                                        padding: '8px',
                                        color: '#e74c3c',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleDeleteTemplate(template.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            {template.exercises.map((exercise, index) => (
                                <div 
                                    key={index}
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr',
                                        gap: '12px',
                                        padding: '8px 0',
                                        borderBottom: index < template.exercises.length - 1 ? '1px solid var(--border-color)' : 'none'
                                    }}
                                >
                                    <span style={{ fontWeight: 500 }}>{exercise}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default Templates; 