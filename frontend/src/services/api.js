import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  register: (username, email, password) =>
    api.post("/auth/register", { username, email, password }),
  login: (email, password) => api.post("/auth/login", { email, password }),
};

export const userAPI = {
  getProfile: () => api.get("/user/profile"),
};

export const deckAPI = {
  getAllDecks: () => api.get("/decks"),
  getDeckById: (id) => api.get(`/decks/${id}`),
  createDeck: (title, description) =>
    api.post("/decks", { title, description }),
  updateDeck: (id, title, description) =>
    api.put(`/decks/${id}`, { title, description }),
  deleteDeck: (id) => api.delete(`/decks/${id}`),
};

export const cardAPI = {
  createCard: (question, answer, deck_id) =>
    api.post("/cards", { question, answer, deck_id }),
  getCardsByDeck: (deck_id) => api.get(`/cards/deck/${deck_id}`),
  updateCard: (id, question, answer) =>
    api.put(`/cards/${id}`, { question, answer }),
  deleteCard: (id) => api.delete(`/cards/${id}`),
};

export const reviewAPI = {
  startReview: (deckId) => api.get(`/review/start/${deckId}`),
  submitAnswer: (deckId, cardId, success) =>
    api.post(`/review/submit/${deckId}/${cardId}`, { success }),
};

export const aiAPI = {
  generateFromPrompt: (prompt, numberOfCards, deck_id) =>
    api.post("/ai-cards/prompt", { prompt, numberOfCards, deck_id }),
  generateFromText: (text, numberOfCards, deck_id) =>
    api.post("/ai-cards/text", { text, numberOfCards, deck_id }),
};

export default api;
