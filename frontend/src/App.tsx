import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Homepage/HomePage';
import SignUpPage from './pages/SignUpPage/SignUpPage';
import LogInPage from './pages/LogInPage/LogInPage';
import VerifyCodePage from './pages/VerifyCode/VerifyCodePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LogInPage />} />
      <Route path="/verify-code" element={<VerifyCodePage />} />
    </Routes>
  );
}
