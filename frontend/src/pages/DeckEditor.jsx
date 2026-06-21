import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { aiAPI, cardAPI, deckAPI } from "../services/api";
import "../styles/modal.css";
import "../styles/review.css";
import "../styles/editor.css";

const emptyCardForm = {
  question: "",
  answer: "",
};

export default function DeckEditor() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [deckTitle, setDeckTitle] = useState("");
  const [deckDescription, setDeckDescription] = useState("");
  const [cardForm, setCardForm] = useState(emptyCardForm);
  const [editingCardId, setEditingCardId] = useState(null);
  const [editingCardForm, setEditingCardForm] = useState(emptyCardForm);
  const [loading, setLoading] = useState(true);
  const [savingDeck, setSavingDeck] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [deletingDeck, setDeletingDeck] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showAiForm, setShowAiForm] = useState(false);

  useEffect(() => {
    const loadDeck = async () => {
      try {
        const response = await deckAPI.getDeckById(deckId);
        setDeck(response.data.deck);
        setCards(response.data.cards || []);
        setDeckTitle(response.data.deck.title || "");
        setDeckDescription(response.data.deck.description || "");
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load deck");
      } finally {
        setLoading(false);
      }
    };

    loadDeck();
  }, [deckId]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      totalCards: cards.length,
      newCards: cards.filter((card) => card.status === 0).length,
      reviewCards: cards.filter(
        (card) => card.status !== 0 && new Date(card.expirationDate).getTime() <= now,
      ).length,
    };
  }, [cards]);

  const refreshDeck = async () => {
    const response = await deckAPI.getDeckById(deckId);
    setDeck(response.data.deck);
    setCards(response.data.cards || []);
    setDeckTitle(response.data.deck.title || "");
    setDeckDescription(response.data.deck.description || "");
  };

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleDeckSubmit = async (e) => {
    e.preventDefault();
    setSavingDeck(true);
    clearFeedback();

    try {
      await deckAPI.updateDeck(deckId, deckTitle, deckDescription);
      setMessage("Deck updated");
      await refreshDeck();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update deck");
    } finally {
      setSavingDeck(false);
    }
  };

  const handleDeleteDeck = async () => {
    if (!window.confirm("Delete this deck and all its cards?")) {
      return;
    }

    setDeletingDeck(true);
    clearFeedback();

    try {
      await deckAPI.deleteDeck(deckId);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete deck");
      setDeletingDeck(false);
    }
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setSavingCard(true);
    clearFeedback();

    try {
      await cardAPI.createCard(cardForm.question, cardForm.answer, deckId);
      setCardForm(emptyCardForm);
      setMessage("Card added");
      await refreshDeck();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add card");
    } finally {
      setSavingCard(false);
    }
  };

  const handleCardEditSubmit = async (e) => {
    e.preventDefault();
    setSavingCard(true);
    clearFeedback();

    try {
      await cardAPI.updateCard(
        editingCardId,
        editingCardForm.question,
        editingCardForm.answer,
      );
      setEditingCardId(null);
      setEditingCardForm(emptyCardForm);
      setMessage("Card updated");
      await refreshDeck();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update card");
    } finally {
      setSavingCard(false);
    }
  };

  const handleCardDelete = async (cardId) => {
    if (!window.confirm("Delete this card?")) {
      return;
    }

    clearFeedback();

    try {
      await cardAPI.deleteCard(cardId);
      setMessage("Card deleted");
      await refreshDeck();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete card");
    }
  };

  const handleGenerateAi = async ({ mode, prompt, text, numberOfCards }) => {
    clearFeedback();

    try {
      if (mode === "prompt") {
        await aiAPI.generateFromPrompt(prompt, numberOfCards, deckId);
      } else {
        await aiAPI.generateFromText(text, numberOfCards, deckId);
      }
      setMessage("AI cards generated");
      setShowAiForm(false);
      await refreshDeck();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate cards");
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!deck) {
    return <div className="error-message">Deck not found</div>;
  }

  return (
    <div className="review-container" style={{ maxWidth: "1100px" }}>
      <div className="review-header">
        <div>
          <p className="profile-label">Deck settings</p>
          <h2>{deck.title}</h2>
        </div>
        <div className="deck-editor-actions">
          <button onClick={() => navigate(`/review/deck/${deckId}`)} className="btn-reveal">
            Study
          </button>
          <button onClick={() => setShowAiForm((value) => !value)} className="btn-secondary">
            {showAiForm ? "Hide AI" : "Generate with AI"}
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      <section className="editor-grid">
        <article className="editor-panel">
          <h3>Deck</h3>
          <form onSubmit={handleDeckSubmit} className="editor-form">
            <input
              type="text"
              value={deckTitle}
              onChange={(e) => setDeckTitle(e.target.value)}
              placeholder="Deck title"
              required
              maxLength={100}
            />
            <textarea
              value={deckDescription}
              onChange={(e) => setDeckDescription(e.target.value)}
              placeholder="Deck description"
              rows={4}
              maxLength={500}
            />
            <div className="editor-actions-row">
              <button type="submit" disabled={savingDeck} className="btn-primary">
                {savingDeck ? "Saving..." : "Save deck"}
              </button>
              <button
                type="button"
                onClick={handleDeleteDeck}
                disabled={deletingDeck}
                className="btn-danger"
              >
                {deletingDeck ? "Deleting..." : "Delete deck"}
              </button>
            </div>
          </form>

          <div className="stats-strip">
            <div>
              <span>Total</span>
              <strong>{stats.totalCards}</strong>
            </div>
            <div>
              <span>New</span>
              <strong>{stats.newCards}</strong>
            </div>
            <div>
              <span>Review</span>
              <strong>{stats.reviewCards}</strong>
            </div>
          </div>
        </article>

        <article className="editor-panel">
          <h3>Add card</h3>
          <form onSubmit={handleCardSubmit} className="editor-form">
            <input
              type="text"
              value={cardForm.question}
              onChange={(e) => setCardForm({ ...cardForm, question: e.target.value })}
              placeholder="Question"
              required
              maxLength={500}
            />
            <textarea
              value={cardForm.answer}
              onChange={(e) => setCardForm({ ...cardForm, answer: e.target.value })}
              placeholder="Answer"
              rows={4}
              required
              maxLength={1000}
            />
            <button type="submit" disabled={savingCard} className="btn-primary">
              {savingCard ? "Saving..." : "Add card"}
            </button>
          </form>
        </article>
      </section>

      {showAiForm && (
        <article className="editor-panel ai-panel">
          <h3>Generate cards with AI</h3>
          <AiForm onSubmit={handleGenerateAi} />
        </article>
      )}

      <section className="cards-section">
        <div className="section-head">
          <h3>Cards</h3>
          <span>{cards.length}</span>
        </div>

        {cards.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <h3>No cards yet</h3>
            <p>Add your first card or generate some with AI.</p>
          </div>
        ) : (
          <div className="cards-list">
            {cards.map((card) => {
              const isEditing = editingCardId === card._id;

              return (
                <article key={card._id} className="card-item">
                  {isEditing ? (
                    <form onSubmit={handleCardEditSubmit} className="editor-form">
                      <input
                        type="text"
                        value={editingCardForm.question}
                        onChange={(e) =>
                          setEditingCardForm({
                            ...editingCardForm,
                            question: e.target.value,
                          })
                        }
                        required
                        maxLength={500}
                      />
                      <textarea
                        value={editingCardForm.answer}
                        onChange={(e) =>
                          setEditingCardForm({
                            ...editingCardForm,
                            answer: e.target.value,
                          })
                        }
                        rows={4}
                        required
                        maxLength={1000}
                      />
                      <div className="editor-actions-row">
                        <button type="submit" className="btn-primary" disabled={savingCard}>
                          {savingCard ? "Saving..." : "Save card"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setEditingCardId(null);
                            setEditingCardForm(emptyCardForm);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="card-label">Question</p>
                      <h4>{card.question}</h4>
                      <p className="card-label" style={{ marginTop: "1rem" }}>
                        Answer
                      </p>
                      <p className="card-text">{card.answer}</p>
                      <div className="card-toolbar">
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setEditingCardId(card._id);
                            setEditingCardForm({
                              question: card.question,
                              answer: card.answer,
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button className="btn-danger" onClick={() => handleCardDelete(card._id)}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function AiForm({ onSubmit }) {
  const [mode, setMode] = useState("course");
  const [numberOfCards, setNumberOfCards] = useState(10);
  const [prompt, setPrompt] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLocalError("");

    if (mode === "prompt" && !prompt.trim()) {
      setLocalError("Prompt required");
      return;
    }

    if (mode === "course" && !text.trim()) {
      setLocalError("Text required");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        mode: mode === "prompt" ? "prompt" : "course",
        prompt,
        text,
        numberOfCards: Number(numberOfCards),
      });
      setPrompt("");
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="editor-form">
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

      {localError && <div className="error-message">{localError}</div>}

      {mode === "course" ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste course notes or content"
          rows={7}
        />
      ) : (
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='Example: "Generate 10 cards on Node.js for beginner level"'
          rows={5}
        />
      )}

      <select value={numberOfCards} onChange={(e) => setNumberOfCards(e.target.value)}>
        {[5, 10, 15, 25, 30, 50].map((value) => (
          <option key={value} value={value}>
            {value} cards
          </option>
        ))}
      </select>

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Generating..." : "Generate"}
      </button>
    </form>
  );
}
