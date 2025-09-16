import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GoalProvider } from './context/GoalContext';
import { CheckInProvider } from './context/CheckInContext';
import { AITutorProvider } from './context/AITutorContext';
import { ThemeProvider } from './context/ThemeContext';
import { GlobalStyles } from './styles/GlobalStyles';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navigation from './components/Navigation';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import VerifyEmail from './components/auth/VerifyEmail';
import Dashboard from './components/Dashboard';
import Goals from './pages/Goals';
import GoalDetail from './pages/GoalDetail';
import Progress from './pages/Progress';
import CheckIn from './pages/CheckIn';
import AITutor from './pages/AITutor';
import RouteTest from './components/RouteTest';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <GlobalStyles />
      <AuthProvider>
        <GoalProvider>
          <CheckInProvider>
            <AITutorProvider>
              <Router>
            <div className="App">
              <Navigation />
              <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/test-routes" element={<RouteTest />} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/goals" 
                element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/goals/:goalId" 
                element={
                  <ProtectedRoute>
                    <GoalDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/progress" 
                element={
                  <ProtectedRoute>
                    <Progress />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/checkin" 
                element={
                  <ProtectedRoute>
                    <CheckIn />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ai-tutor" 
                element={
                  <ProtectedRoute>
                    <AITutor />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
            </Router>
            </AITutorProvider>
          </CheckInProvider>
        </GoalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
