import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { reviewAPI } from "../services/api";
import "../styles/review.css";

export default function Review() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);
  const [nextIntervals, setNextIntervals] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    startReview();
  }, [deckId, navigate]);

  const startReview = async () => {
    try {
      setLoading(true);
      const response = await reviewAPI.startReview(deckId);
      if (response.data.finished) {
        navigate(`/review-finish/${deckId}`);
        return;
      }
      setDeck(response.data.deck);
      setCard(response.data.card);
      setQueueLength(response.data.queueLength);
      setQueuePosition(response.data.queuePosition);
      setNextIntervals(response.data.nextIntervals);
    } catch (err) {
      setError("Failed to start review");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (success) => {
    try {
      setLoading(true);
      const response = await reviewAPI.submitAnswer(deckId, card._id, success);

      if (response.data.finished) {
        navigate(`/review-finish/${deckId}`);
        return;
      }

      setCard(response.data.nextCard);
      setQueueLength(response.data.queueLength);
      setShowAnswer(false);
      setNextIntervals(response.data.nextIntervals);
    } catch (err) {
      setError("Failed to submit answer");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!card) return <div>No cards to review</div>;

  return (
    <div className="review-container">
      <div className="review-header">
        <h2>{deck?.title}</h2>
        <span className="queue-counter">
          {queuePosition}/{queueLength}
        </span>
      </div>

      <div className="card-display">
        <div className="card-front">
          <p className="card-label">Question:</p>
          <p className="card-content">{card.question}</p>
        </div>

        {showAnswer && (
          <div className="card-back">
            <p className="card-label">Answer:</p>
            <p className="card-content">{card.answer}</p>
            {nextIntervals && (
              <div className="intervals-info">
                <p>
                  ✓ Next: {nextIntervals.successTime} | ✗ Reset:{" "}
                  {nextIntervals.failureTime}
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="btn-reveal"
        >
          {showAnswer ? "Hide Answer" : "Show Answer"}
        </button>
      </div>

      {showAnswer && (
        <div className="card-actions">
          <button
            onClick={() => handleSubmitAnswer(false)}
            disabled={loading}
            className="btn-incorrect"
          >
            ✗ Incorrect
          </button>
          <button
            onClick={() => handleSubmitAnswer(true)}
            disabled={loading}
            className="btn-correct"
          >
            ✓ Correct
          </button>
        </div>
      )}

      <button onClick={() => navigate("/dashboard")} className="btn-back">
        Back to Dashboard
      </button>
    </div>
  );
}
