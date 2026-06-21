import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Review from "./pages/Review";
import DeckEditor from "./pages/DeckEditor";
import ReviewFinish from "./pages/ReviewFinish";
import GenerateCardsAI from "./pages/GenerateCardsAI";
import Profile from "./pages/Profile";
import "./styles/app.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/deck/:deckId" element={<DeckEditor />} />
        <Route path="/review/:deckId" element={<Review />} />
        <Route path="/review/deck/:deckId" element={<Review />} />
        <Route path="/review-finish/:deckId" element={<ReviewFinish />} />
        <Route path="/generate-cards-ai" element={<GenerateCardsAI />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
