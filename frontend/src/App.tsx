import { Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/Homepage/HomePage';
import SignUpPage from './pages/SignUpPage/SignUpPage';
import LogInPage from './pages/LogInPage/LogInPage';
import BoardsPage from './pages/BoardsPage/BoardsPage';
import TemplatesPage from './pages/TemplatesPage/TemplatesPage';
import './App.css';

import ProtectedRoute from './auth/ProtectexRoute';
import { isAuthenticated } from '@/auth/token';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LogInPage />} />

      {/* Protected */}
      <Route
        path="/boards"
        element={
          <ProtectedRoute>
            <BoardsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates"
        element={
          <ProtectedRoute>
            <TemplatesPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route
        path="*"
        element={
          isAuthenticated() ? (
            <Navigate to="/boards" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
