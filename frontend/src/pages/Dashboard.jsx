import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deckAPI } from "../services/api";
import DeckCard from "../components/DeckCard";
import CreateDeckModal from "../components/CreateDeckModal";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    fetchDecks();
  }, [navigate]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      const response = await deckAPI.getAllDecks();
      setDecks(response.data.decks);
    } catch (err) {
      setError("Failed to load decks");
    } finally {
      setLoading(false);
    }
  };

  const handleDeckCreated = (newDeck) => {
    setDecks([...decks, newDeck]);
    setShowModal(false);
  };

  const handleDeckDeleted = (deckId) => {
    setDecks(decks.filter((d) => d._id !== deckId));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>Feynman</h1>
        <button onClick={handleLogout}>Logout</button>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>My Decks</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Create Deck
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="decks-grid">
          {decks.length === 0 ? (
            <p>No decks yet. Create one to get started!</p>
          ) : (
            decks.map((deck) => (
              <DeckCard
                key={deck._id}
                deck={deck}
                onDeleted={handleDeckDeleted}
              />
            ))
          )}
        </div>
      </div>

      {showModal && (
        <CreateDeckModal
          onClose={() => setShowModal(false)}
          onDeckCreated={handleDeckCreated}
        />
      )}
    </div>
  );
}
