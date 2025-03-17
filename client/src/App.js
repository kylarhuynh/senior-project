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
import SignUpPage from './pages/signup.tsx';
import EditWorkoutPage from './pages/workouts/editworkout.tsx';
import ViewWorkoutDetails from './pages/workouts/workoutdetails.tsx';
import UsePremadeWorkout from './pages/workouts/usepremadeworkout.tsx';
import CalorieHistory from './pages/calories/calorieshistory.tsx';

function App() {
  return (
    <Router> 
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} /> {/* Redirect from / to /login */}
        <Route path="/login" element={<LoginPage />} />  {/* LoginPage route */}
        <Route path="/signup" element={<SignUpPage />} />  {/* LoginPage route */}
        <Route path="/home" element={<HomePage />} />  {/* HomePage route */}
        <Route path="/workouthome" element={<WorkoutHome />} />  
        <Route path="/calorieshome" element={<CaloriesHome />} />  
        <Route path="/buildworkout" element={<BuildWorkoutPage />} />  
        <Route path="/pastworkouts" element={<ViewPastPage />} />  
        <Route path="/premadeworkouts" element={<PremadeWorkoutsPage />} />  
        <Route path="/freeworkout" element={<FreeWorkout />} />  
        <Route path="/edit-workout/:workoutId" element={<EditWorkoutPage />} />
        <Route path="/view-workout/:workoutId" element={<ViewWorkoutDetails />} />
        <Route path="/premade-workout/:workoutId" element={<UsePremadeWorkout />} />
        <Route path="/calorie-history" element={<CalorieHistory />} />
      </Routes>
    </Router>
  );
}

export default App;
