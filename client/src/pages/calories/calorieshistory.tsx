import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../../styles.css';

type CalorieEntry = {
    id: string;
    food_name: string;
    calories: number;
};

const CalorieHistory: React.FC = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [entries, setEntries] = useState<CalorieEntry[]>([]);
    const [totalCalories, setTotalCalories] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [editingEntry, setEditingEntry] = useState<CalorieEntry | null>(null);
    const [updatedFoodName, setUpdatedFoodName] = useState<string>('');
    const [updatedCalories, setUpdatedCalories] = useState<string>('');
    const [newFoodName, setNewFoodName] = useState<string>('');
    const [newCalories, setNewCalories] = useState<string>('');

    useEffect(() => {
        fetchEntriesForDate(selectedDate);
    }, [selectedDate]);

    const fetchEntriesForDate = async (date: string) => {
        setLoading(true);

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error('Error fetching user:', userError);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('calorie_entries')
            .select('*')
            .eq('user_id', userData.user.id)
            .eq('date', date);

        if (error) {
            console.error('Error fetching entries:', error);
            setLoading(false);
            return;
        }

        setEntries(data);
        setTotalCalories(data.reduce((sum, entry) => sum + entry.calories, 0));
        setLoading(false);
    };

    // Enable edit mode for a selected entry
    const handleEditEntry = (entry: CalorieEntry) => {
        setEditingEntry(entry);
        setUpdatedFoodName(entry.food_name);
        setUpdatedCalories(entry.calories.toString());
    };

    // Save updated entry
    const handleSaveEdit = async () => {
        if (!editingEntry) return;
        if (!updatedFoodName.trim() || !updatedCalories.trim() || isNaN(parseInt(updatedCalories))) {
            alert("Please enter valid food name and calories.");
            return;
        }

        const { error } = await supabase
            .from('calorie_entries')
            .update({ food_name: updatedFoodName, calories: parseInt(updatedCalories) })
            .eq('id', editingEntry.id);

        if (error) {
            console.error('Error updating entry:', error);
            return;
        }

        // Update state with the edited entry
        setEntries(entries.map(entry =>
            entry.id === editingEntry.id ? { ...entry, food_name: updatedFoodName, calories: parseInt(updatedCalories) } : entry
        ));
        setTotalCalories(totalCalories - editingEntry.calories + parseInt(updatedCalories));
        setEditingEntry(null);
    };

    // Delete an entry with confirmation
    const handleDeleteEntry = async (id: string, cal: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this entry?");
        if (!confirmDelete) return;

        const { error } = await supabase
            .from('calorie_entries')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting entry:', error);
            return;
        }

        setEntries(entries.filter(entry => entry.id !== id));
        setTotalCalories(totalCalories - cal);
    };

    // Add a new entry
    const handleAddEntry = async () => {
        if (!newFoodName.trim() || !newCalories.trim() || isNaN(parseInt(newCalories))) {
            alert("Enter a valid food name and calorie amount.");
            return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            console.error('Error fetching user:', userError);
            return;
        }

        const { data, error } = await supabase
            .from('calorie_entries')
            .insert([
                {
                    user_id: userData.user.id,
                    food_name: newFoodName,
                    calories: parseInt(newCalories),
                    date: selectedDate
                }
            ])
            .select();

        if (error) {
            console.error('Error adding entry:', error);
            return;
        }

        setEntries([...entries, data[0]]);
        setTotalCalories(totalCalories + parseInt(newCalories));
        setNewFoodName('');
        setNewCalories('');
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
            <div className="content-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 className="section-header" style={{ margin: 0 }}>Calorie History</h3>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)'
                        }}
                    />
                </div>

                <div className="stat-display" style={{ marginBottom: '24px' }}>
                    <span style={{ fontSize: '32px', color: 'var(--primary-color)' }}>
                        {totalCalories}
                    </span>
                    <span>total calories</span>
                </div>

                {/* Add New Entry */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 className="section-header">Add Entry</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px' }}>
                        <input
                            type="text"
                            placeholder="Food Name"
                            value={newFoodName}
                            onChange={(e) => setNewFoodName(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)'
                            }}
                        />
                        <input
                            type="number"
                            placeholder="Calories"
                            value={newCalories}
                            onChange={(e) => setNewCalories(e.target.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                width: '120px'
                            }}
                        />
                        <button className="primary-button" onClick={handleAddEntry}>Add</button>
                    </div>
                </div>

                {/* Food Entries List */}
                <h3 className="section-header">Entries for {new Date(selectedDate).toLocaleDateString()}</h3>
                {loading ? (
                    <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        Loading entries...
                    </p>
                ) : entries.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                        No entries for this date.
                    </p>
                ) : (
                    <div>
                        {entries.map(entry => (
                            <div 
                                key={entry.id}
                                style={{
                                    padding: '12px 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}
                            >
                                {editingEntry && editingEntry.id === entry.id ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            value={updatedFoodName}
                                            onChange={(e) => setUpdatedFoodName(e.target.value)}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)'
                                            }}
                                        />
                                        <input
                                            type="number"
                                            value={updatedCalories}
                                            onChange={(e) => setUpdatedCalories(e.target.value)}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid var(--border-color)',
                                                width: '120px'
                                            }}
                                        />
                                        <button className="primary-button" onClick={handleSaveEdit}>Save</button>
                                        <button 
                                            className="secondary-button"
                                            onClick={() => setEditingEntry(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{entry.food_name}</div>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                {entry.calories} calories
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                onClick={() => handleEditEntry(entry)}
                                                style={{
                                                    padding: '4px 8px',
                                                    color: 'var(--text-secondary)',
                                                    border: 'none',
                                                    background: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEntry(entry.id, entry.calories)}
                                                style={{
                                                    padding: '4px 8px',
                                                    color: '#e74c3c',
                                                    border: 'none',
                                                    background: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalorieHistory;
