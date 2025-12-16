import { Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import SignUpPage from './SignUpPage';
import LogInPage from './LogInPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LogInPage />} />
    </Routes>
  );
}
