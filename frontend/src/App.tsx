import { Routes, Route, Navigate } from 'react-router-dom';

import SignUpPage from './pages/SignUpPage/SignUpPage';
import LogInPage from './pages/LogInPage/LogInPage';
import BoardsPage from './pages/BoardsPage/BoardsPage';
import OtherBoardsPage from './pages/OtherBoardsPage/OtherBoardsPage';
import BoardPage from './pages/BoardPage/BoardPage';
import './App.css';

import ProtectedRoute from './auth/ProtectedRoute';
import { isAuthenticated } from '@/auth/token';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/boards" replace />} />
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
        path="/other-boards"
        element={
          <ProtectedRoute>
            <OtherBoardsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/boards/:boardId"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route
        path="*"
        element={
          isAuthenticated() ? <Navigate to="/boards" replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}
