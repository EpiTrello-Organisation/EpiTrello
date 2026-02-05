import { Navigate } from 'react-router-dom';
import { isAuthenticated } from './token';
import type { JSX } from 'react/jsx-dev-runtime';

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
