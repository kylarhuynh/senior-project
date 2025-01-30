import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/login.tsx';  // Importing the LoginPage component
import HomePage from './pages/home.tsx';    // Importing the HomePage component
import WorkoutHome from './pages/workouts/workouthome.tsx';
import CaloriesHome from './pages/calories/calorieshome.tsx';
import BuildWorkoutPage from './pages/workouts/buildworkout.tsx';

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
      </Routes>
    </Router>
  );
}

export default App;
