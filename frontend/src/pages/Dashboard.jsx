import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deckAPI, userAPI } from "../services/api";
import DeckCard from "../components/DeckCard";
import CreateDeckModal from "../components/CreateDeckModal";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [decks, setDecks] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    const loadDashboard = async () => {
      await Promise.all([fetchUser(), fetchDecks()]);
    };

    loadDashboard();
  }, [navigate]);

  const fetchUser = async () => {
    try {
      const response = await userAPI.getProfile();
      setUser(response.data.user);
    } catch (err) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  };

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

  const sortedDecks = [...decks].sort(
    (firstDeck, secondDeck) =>
      new Date(secondDeck.updatedAt || secondDeck.createdAt) -
      new Date(firstDeck.updatedAt || firstDeck.createdAt),
  );

  const latestDeck = sortedDecks[0];
  const deckCount = decks.length;
  const createdLabel = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric",
      })
    : null;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <div className="dashboard-background" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <nav className="navbar dashboard-navbar">
        <div className="brand-block">
          <div className="brand-mark">K</div>
          <div>
            <h1>Kairos</h1>
            <p className="dashboard-welcome">
              {user?.username
                ? `Bienvenue, ${user.username}`
                : "Bienvenue sur votre tableau de bord"}
            </p>
          </div>
        </div>

        <div className="navbar-actions">
          <div className="user-chip">
            <span className="user-chip-label">Compte</span>
            <strong>{user?.username || "Utilisateur"}</strong>
          </div>
          <button onClick={handleLogout} className="btn-ghost">
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-content">
        <section className="dashboard-hero">
          <div className="hero-copy">
            <p className="hero-kicker">Spaced repetition workspace</p>
            <h2>
              {user?.username
                ? `${user.username}, prêt pour une session claire et rapide ?`
                : "Votre espace de révision est prêt."}
            </h2>
            <p className="hero-text">
              Reprenez vos cartes, créez de nouveaux decks et gardez votre
              progression sous contrôle depuis un seul endroit.
            </p>

            <div className="hero-actions">
              <button onClick={() => setShowModal(true)} className="btn-primary">
                + Create Deck
              </button>
              {latestDeck && (
                <button
                  onClick={() => navigate(`/review/${latestDeck._id}`)}
                  className="btn-secondary"
                >
                  Study last deck
                </button>
              )}
            </div>
          </div>

          <aside className="profile-card">
            <div className="profile-avatar">
              {user?.username ? user.username.slice(0, 1).toUpperCase() : "K"}
            </div>
            <div className="profile-meta">
              <p className="profile-label">Profil actif</p>
              <h3>{user?.username || "Utilisateur"}</h3>
              <p>{user?.email || "Connecté à votre espace Kairos"}</p>
            </div>

            <div className="profile-details">
              <div>
                <span>Decks</span>
                <strong>{deckCount}</strong>
              </div>
              <div>
                <span>Membre depuis</span>
                <strong>{createdLabel || "-"}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section className="dashboard-stats" aria-label="Dashboard metrics">
          <article className="stat-card">
            <span className="stat-label">Decks total</span>
            <strong>{deckCount}</strong>
            <p>Vos collections en cours de révision.</p>
          </article>
          <article className="stat-card">
            <span className="stat-label">Deck récent</span>
            <strong>{latestDeck?.title || "Aucun deck"}</strong>
            <p>
              {latestDeck
                ? latestDeck.description || "Sans description"
                : "Créez votre premier deck pour commencer."}
            </p>
          </article>
          <article className="stat-card">
            <span className="stat-label">Focus</span>
            <strong>Révision courte</strong>
            <p>10 minutes par session suffisent pour consolider.</p>
          </article>
        </section>

        <section className="dashboard-header">
          <div>
            <p className="section-label">Your decks</p>
            <h2>My Decks</h2>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Create Deck
          </button>
        </section>

        {error && <div className="error-message">{error}</div>}

        <div className="decks-grid">
          {sortedDecks.length === 0 ? (
            <div className="empty-state">
              <h3>Aucun deck pour le moment</h3>
              <p>
                Créez un deck pour démarrer vos révisions et voir votre
                progression ici.
              </p>
              <button onClick={() => setShowModal(true)} className="btn-primary">
                Create your first deck
              </button>
            </div>
          ) : (
            sortedDecks.map((deck) => (
              <DeckCard
                key={deck._id}
                deck={deck}
                onDeleted={handleDeckDeleted}
              />
            ))
          )}
        </div>
      </main>

      {showModal && (
        <CreateDeckModal
          onClose={() => setShowModal(false)}
          onDeckCreated={handleDeckCreated}
        />
      )}
    </div>
  );
}
