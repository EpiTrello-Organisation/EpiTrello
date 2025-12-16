import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Homepage/HomePage';
import SignUpPage from './pages/SignUpPage/SignUpPage';
import LogInPage from './pages/LogInPage/LogInPage';
import VerifyCodePage from './pages/VerifyCode/VerifyCodePage';
import CompleteProfilePage from './pages/CompleteProfilePage/CompleteProfilePage';
import KanbanPage from './pages/KanbanPage/KanbanPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LogInPage />} />
      <Route path="/verify-code" element={<VerifyCodePage />} />
      <Route path="/complete-profile" element={<CompleteProfilePage />} />
      <Route path="/kanban" element={<KanbanPage />} />
    </Routes>
  );
}
