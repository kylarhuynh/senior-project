import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/login.tsx';  // Importing the LoginPage component
import HomePage from './pages/home.tsx';    // Importing the HomePage component
import WorkoutHome from './pages/workouts/workouthome.tsx';
import CaloriesHome from './pages/calories/calorieshome.tsx';

function App() {
  return (
    <Router> 
      <Routes>
        <Route path="/login" element={<LoginPage />} />  {/* LoginPage route */}
        <Route path="/home" element={<HomePage />} />  {/* HomePage route */}
        <Route path="/workouthome" element={<WorkoutHome />} />  
        <Route path="/calorieshome" element={<CaloriesHome />} />  

      </Routes>
    </Router>
  );
}

export default App;
