import React from "react";
import { useNavigate } from "react-router-dom";
import { deckAPI } from "../services/api";
import "../styles/deck-card.css";

export default function DeckCard({ deck, onDeleted }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this deck?")) {
      try {
        setLoading(true);
        await deckAPI.deleteDeck(deck._id);
        onDeleted(deck._id);
      } catch (err) {
        alert("Failed to delete deck");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStudy = () => {
    navigate(`/review/${deck._id}`);
  };

  const handleEdit = () => {
    navigate(`/deck/${deck._id}`);
  };

  return (
    <div className="deck-card">
      <h3>{deck.title}</h3>
      <p>{deck.description || "No description"}</p>
      <div className="deck-stats">
        <span>Cards: {deck.cardCount || 0}</span>
      </div>
      <div className="deck-actions">
        <button onClick={handleStudy} className="btn-study">
          Study
        </button>
        <button onClick={handleEdit} className="btn-edit">
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="btn-danger"
        >
          {loading ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
