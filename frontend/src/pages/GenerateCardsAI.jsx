import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { aiAPI, deckAPI } from "../services/api";
import "../styles/modal.css";
import "../styles/editor.css";

export default function GenerateCardsAI() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [decks, setDecks] = useState([]);
  const [deckId, setDeckId] = useState(searchParams.get("deck_id") || "");
  const [mode, setMode] = useState("course");
  const [numberOfCards, setNumberOfCards] = useState(10);
  const [courseText, setCourseText] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadDecks = async () => {
      try {
        const response = await deckAPI.getAllDecks();
        setDecks(response.data.decks || []);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load decks");
      } finally {
        setLoading(false);
      }
    };

    loadDecks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "prompt") {
        await aiAPI.generateFromPrompt(customPrompt, Number(numberOfCards), deckId);
      } else {
        await aiAPI.generateFromText(courseText, Number(numberOfCards), deckId);
      }

      setMessage("Cards generated successfully");
      setCourseText("");
      setCustomPrompt("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate cards");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="modal-overlay" style={{ padding: "24px" }}>
      <div className="modal-content" style={{ maxWidth: "860px", width: "100%" }}>
        <div className="modal-header">
          <div>
            <h2>Generate Cards with AI</h2>
            <p style={{ marginTop: 6, color: "#64748b", fontSize: 14 }}>
              Pick a deck and generate cards from course text or a prompt.
            </p>
          </div>
          <button className="close-btn" onClick={() => navigate("/dashboard")}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit} className="editor-form">
          <select value={deckId} onChange={(e) => setDeckId(e.target.value)} required>
            <option value="">Choose a deck</option>
            {decks.map((deck) => (
              <option key={deck._id} value={deck._id}>
                {deck.title}
              </option>
            ))}
          </select>

          <div className="mode-switch">
            <button
              type="button"
              className={mode === "course" ? "btn-primary" : "btn-secondary"}
              onClick={() => setMode("course")}
            >
              Course
            </button>
            <button
              type="button"
              className={mode === "prompt" ? "btn-primary" : "btn-secondary"}
              onClick={() => setMode("prompt")}
            >
              Prompt
            </button>
          </div>

          {mode === "course" ? (
            <textarea
              value={courseText}
              onChange={(e) => setCourseText(e.target.value)}
              placeholder="Paste course notes or content"
              rows={10}
              required
            />
          ) : (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder='Example: "Generate 10 cards on chemistry for high school"'
              rows={8}
              required
            />
          )}

          <select value={numberOfCards} onChange={(e) => setNumberOfCards(e.target.value)}>
            {[5, 10, 15, 25, 30, 50].map((value) => (
              <option key={value} value={value}>
                {value} cards
              </option>
            ))}
          </select>

          <div className="editor-actions-row">
            <button type="submit" disabled={submitting || !deckId} className="btn-primary">
              {submitting ? "Generating..." : "Generate cards"}
            </button>
            <button type="button" onClick={() => navigate("/dashboard")} className="btn-secondary">
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
