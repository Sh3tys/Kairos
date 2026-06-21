import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deckAPI } from "../services/api";
import "../styles/modal.css";

export default function DeckEditor() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDeck = async () => {
      try {
        const response = await deckAPI.getDeckById(deckId);
        setTitle(response.data.deck.title || "");
        setDescription(response.data.deck.description || "");
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load deck");
      } finally {
        setLoading(false);
      }
    };

    loadDeck();
  }, [deckId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      await deckAPI.updateDeck(deckId, title, description);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update deck");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="modal-overlay" style={{ padding: "24px" }}>
      <div className="modal-content" style={{ maxWidth: "640px", width: "100%" }}>
        <div className="modal-header">
          <h2>Edit Deck</h2>
          <button className="close-btn" onClick={() => navigate("/dashboard")}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Deck Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
          />
          <textarea
            placeholder="Deck Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
          <div className="modal-actions">
            <button type="button" onClick={() => navigate("/dashboard")} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
