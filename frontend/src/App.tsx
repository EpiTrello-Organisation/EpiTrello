import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/Homepage/HomePage';
import SignUpPage from './pages/SignUpPage/SignUpPage';
import LogInPage from './pages/LogInPage/LogInPage';
import BoardsPage from './pages/BoardsPage/BoardsPage';
import TemplatesPage from './pages/TemplatesPage/TemplatesPage';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LogInPage />} />
      <Route path="/boards" element={<BoardsPage />} />
      <Route path="/templates" element={<TemplatesPage />} />
    </Routes>
  );
}
