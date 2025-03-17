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
    const [editingEntry, setEditingEntry] = useState<CalorieEntry | null>(null); // Tracks the entry being edited
    const [updatedFoodName, setUpdatedFoodName] = useState<string>('');
    const [updatedCalories, setUpdatedCalories] = useState<string>('');

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

    return (
        <div className="calorie-history-container">
            <h1>Calorie History</h1>

            {/* Date Picker for Selecting a Date */}
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker"
            />

            {/* Display Calorie Summary */}
            <div className="calorie-summary">
                <h2>Total Calories: {totalCalories} cal</h2>
            </div>

            {/* Food Entries for Selected Date */}
            {loading ? (
                <p>Loading entries...</p>
            ) : (
                <ul className="food-list">
                    {entries.length === 0 ? (
                        <p>No entries for this date.</p>
                    ) : (
                        entries.map(entry => (
                            <li key={entry.id} className="food-entry-item">
                                {editingEntry && editingEntry.id === entry.id ? (
                                    <div className="edit-entry-container">
                                        <input
                                            type="text"
                                            value={updatedFoodName}
                                            onChange={(e) => setUpdatedFoodName(e.target.value)}
                                            className="edit-food-input"
                                        />
                                        <input
                                            type="number"
                                            value={updatedCalories}
                                            onChange={(e) => setUpdatedCalories(e.target.value)}
                                            className="edit-calories-input"
                                        />
                                        <button onClick={handleSaveEdit} className="save-edit-btn">Save</button>
                                        <button onClick={() => setEditingEntry(null)} className="cancel-edit-btn">Cancel</button>
                                    </div>
                                ) : (
                                    <div className="entry-display">
                                        {entry.food_name} - {entry.calories} cal
                                        <button onClick={() => handleEditEntry(entry)} className="edit-btn">Edit</button>
                                    </div>
                                )}
                            </li>
                        ))
                    )}
                </ul>
            )}

            {/* Back Button */}
            <div className="fixed-bottom-left">
                <button onClick={() => navigate('/calorieshome')}>Back</button>
            </div>
        </div>
    );
};

export default CalorieHistory;
