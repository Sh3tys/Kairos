import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/review.css";

export default function ReviewFinish() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="review-container">
      <div className="review-header">
        <h2>Review complete</h2>
      </div>

      <div className="card-display">
        <p className="card-content">Nice work, you have finished this deck for now.</p>
      </div>

      <button onClick={() => navigate(`/review/${deckId}`)} className="btn-reveal">
        Review again
      </button>
      <button onClick={() => navigate("/dashboard")} className="btn-back">
        Back to Dashboard
      </button>
    </div>
  );
}
