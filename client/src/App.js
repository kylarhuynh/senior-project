import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login.tsx';  // Importing the LoginPage component
import HomePage from './pages/home.tsx';    // Importing the HomePage component
import WorkoutHome from './pages/workouts/workouthome.tsx';
import CaloriesHome from './pages/calories/calorieshome.tsx';
import BuildWorkoutPage from './pages/workouts/buildworkout.tsx';
import ViewPastPage from './pages/workouts/viewpastworkouts.tsx';
import PremadeWorkoutsPage from './pages/workouts/premadeworkouts.tsx';
import FreeWorkout from './pages/workouts/freeworkout.tsx';

function App() {
  return (
    <Router> 
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} /> {/* Redirect from / to /login */}
        <Route path="/login" element={<LoginPage />} />  {/* LoginPage route */}
        <Route path="/home" element={<HomePage />} />  {/* HomePage route */}
        <Route path="/workouthome" element={<WorkoutHome />} />  
        <Route path="/calorieshome" element={<CaloriesHome />} />  
        <Route path="/buildworkout" element={<BuildWorkoutPage />} />  
        <Route path="/pastworkouts" element={<ViewPastPage />} />  
        <Route path="/premadeworkouts" element={<PremadeWorkoutsPage />} />  
        <Route path="/freeworkout" element={<FreeWorkout />} />  

      </Routes>
    </Router>
  );
}

export default App;
