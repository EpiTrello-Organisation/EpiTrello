import { Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import SignInPage from "./SignInPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SignInPage />} />
    </Routes>
  );
}
