import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Login from './pages/login.tsx';
import Home from './pages/home.tsx';
import WorkoutHome from './pages/workouts/workouthome.tsx';
import WorkoutCreator from './pages/workouts/workout-creator.tsx';
import Templates from './pages/workouts/templates.tsx';
import ActivityFeed from './pages/workouts/activity-feed.tsx';
import CaloriesHome from './pages/calories/calorieshome.tsx';
import CaloriesHistory from './pages/calories/calorieshistory.tsx';
import SignUpPage from './pages/signup.tsx';
import MapView from './pages/map/MapView.tsx';

/* Old workout pages moved to /pages/oldWorkouts:
import BuildWorkoutPage from './pages/oldWorkouts/buildworkout.tsx';
import ViewPastPage from './pages/oldWorkouts/viewpastworkouts.tsx';
import PremadeWorkoutsPage from './pages/oldWorkouts/premadeworkouts.tsx';
import FreeWorkout from './pages/oldWorkouts/freeworkout.tsx';
import EditWorkoutPage from './pages/oldWorkouts/editworkout.tsx';
import ViewWorkoutDetails from './pages/oldWorkouts/workoutdetails.tsx';
import UsePremadeWorkout from './pages/oldWorkouts/usepremadeworkout.tsx';
*/

function App() {
  return (
    <Router>
      <Routes>
        {/* Login route outside of layout */}
        <Route path="/login" element={<Login />} />

        {/* All other routes wrapped in Layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/workouthome" element={<WorkoutHome />} />
          <Route path="/workout-creator" element={<WorkoutCreator />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/activity-feed" element={<ActivityFeed />} />
          <Route path="/calorieshome" element={<CaloriesHome />} />
          <Route path="/calorieshistory" element={<CaloriesHistory />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Route>

        <Route path="/signup" element={<SignUpPage />} />
      </Routes>
    </Router>
  );
}

export default App;
