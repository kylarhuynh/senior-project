import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';

interface DayEntry {
    date: string;
    total_calories: number;
    entries: {
        id: string;
        food_name: string;
        calories: number;
    }[];
}

const CaloriesHistory: React.FC = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<DayEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDates, setExpandedDates] = useState<string[]>([]);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;

        const { data: entries } = await supabase
            .from('calorie_entries')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('date', { ascending: false });

        if (entries) {
            const groupedByDate = entries.reduce((acc: { [key: string]: DayEntry }, entry) => {
                if (!acc[entry.date]) {
                    acc[entry.date] = {
                        date: entry.date,
                        total_calories: 0,
                        entries: []
                    };
                }
                acc[entry.date].entries.push({
                    id: entry.id,
                    food_name: entry.food_name,
                    calories: entry.calories
                });
                acc[entry.date].total_calories += entry.calories;
                return acc;
            }, {});

            setHistory(Object.values(groupedByDate));
        }
        setLoading(false);
    };

    const toggleDateExpansion = (date: string) => {
        setExpandedDates(prev =>
            prev.includes(date)
                ? prev.filter(d => d !== date)
                : [...prev, date]
        );
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <h1 style={{ 
                    margin: 0,
                    fontSize: '2rem',
                    color: 'var(--text-primary)'
                }}>
                    Calorie History
                </h1>
                <button
                    className="secondary-button"
                    onClick={() => navigate('/calorieshome')}
                    style={{ padding: '8px 16px' }}
                >
                    Back to Tracker
                </button>
            </div>

            {loading ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    color: 'var(--text-secondary)'
                }}>
                    Loading history...
                </div>
            ) : history.length === 0 ? (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px', 
                    color: 'var(--text-secondary)'
                }}>
                    No history available
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {history.map((day) => (
                        <div 
                            key={day.date} 
                            className="content-card"
                            style={{ overflow: 'hidden' }}
                        >
                            <div
                                onClick={() => toggleDateExpansion(day.date)}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    cursor: 'pointer',
                                    borderBottom: expandedDates.includes(day.date) ? '1px solid var(--border-color)' : 'none'
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                        {formatDate(day.date)}
                                    </div>
                                    <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        {day.entries.length} entries
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                        {day.total_calories} cal
                                    </div>
                                    <div style={{ 
                                        color: 'var(--text-secondary)',
                                        fontSize: '14px',
                                        marginTop: '4px'
                                    }}>
                                        {expandedDates.includes(day.date) ? 'Click to collapse' : 'Click to expand'}
                                    </div>
                                </div>
                            </div>

                            {expandedDates.includes(day.date) && (
                                <div style={{ backgroundColor: 'var(--background-color)' }}>
                                    {day.entries.map((entry, index) => (
                                        <div
                                            key={entry.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                padding: '12px 16px',
                                                borderBottom: index < day.entries.length - 1 ? '1px solid var(--border-color)' : 'none'
                                            }}
                                        >
                                            <div style={{ fontWeight: 500 }}>
                                                {entry.food_name}
                                            </div>
                                            <div style={{ color: 'var(--text-secondary)' }}>
                                                {entry.calories} cal
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CaloriesHistory;
