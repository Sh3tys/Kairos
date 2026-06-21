# Feynman - Spaced Repetition Learning Platform

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-black)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-green)](https://www.mongodb.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

</div>

A fully API-driven learning platform with separate backend API and frontend UI, ready for deployment to Vercel and mobile app integration.

## 🏗️ Architecture

**Feynman** is now a modular, API-first platform:

- **API Backend** (`/api`) - RESTful JSON API with JWT authentication
- **Frontend** (`/frontend`) - React + Vite SPA consuming the API
- **Mobile Ready** - API can be used by Android/iOS apps

This architecture enables:

- ✅ Independent scaling of frontend and backend
- ✅ Easy mobile app integration
- ✅ Separate Vercel deployments
- ✅ Better security and maintainability

---

## 📁 Project Structure

```
Anki_revision/
├── api/                    # Backend REST API
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # API endpoint handlers
│   │   ├── middleware/    # Authentication & validation
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── algorithm/     # Spaced repetition algorithm
│   │   └── utils/         # Utility functions
│   ├── server.js          # API entry point
│   ├── package.json
│   ├── vercel.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/              # React + Vite UI
│   ├── src/
│   │   ├── pages/        # Page components (Login, Dashboard, Review)
│   │   ├── components/   # Reusable components
│   │   ├── services/     # API client
│   │   ├── styles/       # CSS files
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/           # Static assets
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   ├── .env.example
│   └── .gitignore
│
└── README.md             # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- HuggingFace API token (for AI card generation)

### 1️⃣ API Setup

```bash
cd api
npm install

# Create .env file
cp .env.example .env
```

Edit `api/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/feynman
JWT_SECRET=your-secret-key-at-least-32-characters-long
HUGGINGFACE_API_TOKEN=hf_xxxxxxxxxxxxx
```

Start the API:

```bash
npm run dev
```

API runs at `http://localhost:5000` with health check at `/health`

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## 📡 API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication (Public)

```
POST   /auth/register          Register new user
POST   /auth/login             Login user
```

### Decks (Protected)

```
GET    /decks                  Get all user's decks
POST   /decks                  Create new deck
GET    /decks/:id              Get deck with cards
PUT    /decks/:id              Update deck
DELETE /decks/:id              Delete deck
```

### Cards (Protected)

```
POST   /cards                  Create new card
GET    /cards/deck/:deck_id    Get cards for deck
PUT    /cards/:id              Update card
DELETE /cards/:id              Delete card
```

### Review (Protected)

```
GET    /review/start/:deckId   Start review session
POST   /review/submit/:deckId/:cardId   Submit card answer
```

### AI (Protected)

```
POST   /ai-cards/prompt        Generate cards from prompt
POST   /ai-cards/text          Generate cards from text
```

**All protected endpoints require JWT token in header:**

```
Authorization: Bearer <token>
```

---

## 🔐 Authentication

1. Register or login → receive JWT token
2. Token stored in browser localStorage
3. Token automatically included in API requests
4. Token expires after 7 days
5. Invalid/expired tokens trigger automatic redirect to login

---

## 🎓 Features

### Learning

- ✅ Create and organize study decks
- ✅ Add, edit, and delete flashcards
- ✅ AI-powered card generation from text or prompts
- ✅ Spaced repetition review sessions

### Algorithm

- ✅ 12-stage progressive learning system (1 min → 120 days)
- ✅ Error penalty system (reduces review intervals)
- ✅ Adaptive scheduling based on performance
- ✅ Efficient study queue management

### Technical

- ✅ RESTful JSON API
- ✅ JWT authentication
- ✅ CORS-enabled for frontend
- ✅ Production-ready error handling
- ✅ MongoDB persistence
- ✅ HuggingFace AI integration

---

## 🚀 Deployment to Vercel

### Step 1: Deploy API

```bash
cd api
npm install -g vercel
vercel
```

Follow prompts, then set environment variables in Vercel dashboard:

```
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-secret-key>
HUGGINGFACE_API_TOKEN=<your-token>
```

Note your API URL: `https://your-api-domain.vercel.app`

### Step 2: Deploy Frontend

```bash
cd ../frontend
vercel
```

Set environment variable in Vercel dashboard:

```
VITE_API_URL=https://your-api-domain.vercel.app/api
```

Your app is now live! 🎉

---

## 📱 Mobile App Integration

The API is fully RESTful and mobile-friendly. Example for Android/Flutter:

```kotlin
// Register
POST /api/auth/register
{
  "username": "user",
  "email": "user@example.com",
  "password": "password"
}

// Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "username": "user",
    "email": "user@example.com"
  }
}

// Use token for all requests
headers: {
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

---

## 🔒 Security Features

- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ JWT token-based authentication
- ✅ Helmet security headers
- ✅ CORS properly configured
- ✅ Request size limits (10KB)
- ✅ Input validation and sanitization
- ✅ MongoDB injection protection
- ✅ Secure token expiration (7 days)

---

## ⚙️ Stack

### Backend

- Node.js 18+ / Express.js 5
- MongoDB 7 / Mongoose 9.6
- JWT / Bcrypt
- Helmet / CORS

### Frontend

- React 18 / React Router 6
- Vite 8 / Axios
- CSS Grid & Flexbox
- Responsive design

---

## 👥 Team

- Franck Huang
- Armando Dapa
- Titouan Conquere de Monbrison
- Max Silva Dos Reis

---

## 📄 License

ISC License

---

**Questions?** Open an issue or check the docs in each `/api` and `/frontend` folder.

# Clé secrète pour les sessions (générez une clé sécurisée)

SESSION_SECRET=votre_cle_secrete_tres_securisee_ici_changez_moi

# Clé API pour l'IA Hugging Face(https://huggingface.co/)

HUGGINGFACE_API_TOKEN=votre_cle_api_huggingface_ici_changez_moi

````

#### 4. Démarrer l'Application

```bash
# Pour le mode développement avec rechargement automatique :
npm run dev

# Pour le mode production :
npm start
````

L'application sera disponible à `http://localhost:5000`

---

## Scripts Disponibles

| Commande        | Description                                         |
| --------------- | --------------------------------------------------- |
| `npm run dev`   | Lance le serveur en mode développement avec nodemon |
| `npm start`     | Lance le serveur en mode production                 |
| `npm run build` | Compile les assets frontend avec Vite               |
| `npm run serve` | Prévisualise les assets compilés                    |
| `npm run bp`    | Exécute build + serve (build et prévisualisation)   |

---

## Architecture et Structure du Projet

L'application suit l'architecture **MVC**.

### Structure des Dossiers

```
Anki_revision/
├── src/
│   ├── controllers/                  # Logique métier
│   │   ├── auth.controller.js        # Authentification & autorisation
│   │   ├── card.controller.js        # Gestion des cartes (CRUD)
│   │   ├── cardAI.controller.js      # Génération IA de cartes
│   │   ├── dashboard.controller.js   # Tableau de bord utilisateur
│   │   ├── deck.controller.js        # Gestion des decks (CRUD)
│   │   ├── review.controller.js      # Système de révision
│   │   └── user.controller.js        # Gestion des utilisateurs
│   │
│   ├── routes/                       # Points de terminaison API
│   │   ├── auth.route.js             # Routes d'authentification
│   │   ├── card.route.js             # Routes des cartes
│   │   ├── cardAI.route.js           # Routes de génération IA
│   │   ├── dashboard.route.js        # Routes du dashboard
│   │   ├── deck.route.js             # Routes des decks
│   │   ├── review.route.js           # Routes de révision
│   │   └── user.route.js             # Routes utilisateurs
│   │
│   ├── models/                       # Schémas MongoDB
│   │   ├── card.model.js             # Modèle de carte (12 stages, espacement)
│   │   ├── deck.model.js             # Modèle de deck (collections de cartes)
│   │   └── user.model.js             # Modèle utilisateur (authentification)
│   │
│   ├── middleware/                   # Middlewares Express
│   │   └── auth.middleware.js        # Vérification des sessions & droits
│   │
│   ├── config/                       # Configuration
│   │   └── db.js                     # Connexion MongoDB
│   │
│   ├── algorithm/                    # Algorithme d'espacement
│   │   └── algo.js                   # Logique SM-2 adaptée (12 stages)
│   │
│   └── views/                        # Templates EJS
│       ├── error.ejs                 # Page d'erreur
│       ├── auth/
│       │   ├── login.ejs             # Connexion
│       │   └── register.ejs          # Inscription
│       ├── cards/
│       │   └── createAICard.ejs      # Générateur IA de cartes
│       ├── dashboard/
│       │   ├── index.ejs             # Tableau de bord principal
│       │   └── deck/
│       │       ├── index.ejs         # Liste des decks
│       │       └── detail.ejs        # Détail d'un deck
│       ├── deck/
│       │   └── detail.ejs            # Vue détaillée du deck
│       ├── partials/
│       │   ├── header.ejs            # En-tête réutilisable
│       │   └── footer.ejs            # Pied de page réutilisable
│       └── review/
│           ├── study.ejs             # Interface de révision
│           └── finish.ejs            # Écran de fin de session
│
├── public/                           # Ressources statiques
│   ├── css/
│   │   └── style.css                 # Styles personnalisés
│   ├── js/
│   │   ├── index.js                  # Scripts principaux
│   │   └── createAICard.js           # Scripts pour génération IA
│   └── images/                       # Images du projet
│
├── server.js                         # Point d'entrée principal
├── package.json                      # Dépendances & scripts
├── .env.example                      # Exemple de configuration
└── README.md                         # Ce fichier
```

---

## Routes

### Authentification

```
GET    /                    # Page d'inscription (défaut)
GET    /register            # Formulaire d'inscription
POST   /register            # Créer un compte
GET    /login               # Formulaire de connexion
POST   /login               # Connexion utilisateur
```

### Dashboard

```
GET    /dashboard           # Tableau de bord principal (protégé)
```

### Gestion des Decks

```
GET    /deck                # Lister tous les decks
POST   /deck                # Créer un deck
POST   /deck/create-default # Créer un deck par défaut
GET    /deck/:id            # Obtenir un deck par ID
PUT    /deck/:id            # Mettre à jour un deck
DELETE /deck/:id            # Supprimer un deck
```

### Gestion des Cartes

```
GET    /card                # Lister toutes les cartes
GET    /card/:id            # Obtenir une carte par ID
POST   /card                # Créer une carte
PUT    /card/:id            # Mettre à jour une carte
DELETE /card/:id            # Supprimer une carte
```

### Génération IA de Cartes

```
GET    /generate-cards-ai   # Page de création IA
POST   /generate-cards-ai   # Générer des cartes via IA
```

### Système de Révision

```
GET    /review/deck/:deckId         # Démarrer une session de révision
POST   /review/deck/:deckId/card/:cardId # Soumettre une réponse
```

### Gestion Utilisateurs

```
GET    /user                # Données de l'utilisateur (protégé)
```

---

## Algorithme d'Espacement

L'application implémente un algorithme de **répétition espacée adaptatif** inspiré de la méthode SM-2 d'Anki.

### Étapes de Progression (12 Stages)

```
Stage 0: 1 minute
Stage 1: 5 minutes
Stage 2: 15 minutes
Stage 3: 1 heure
Stage 4: 6 heures
Stage 5: 1 jour
Stage 6: 3 jours
Stage 7: 7 jours
Stage 8: 14 jours
Stage 9: 30 jours
Stage 10: 60 jours
Stage 11: 120 jours
```

### Mécanismes de Progression

| Condition                          | Action                                          |
| ---------------------------------- | ----------------------------------------------- |
| Réponse correcte (2x consécutives) | Progression au stage suivant                    |
| Réponse incorrecte                 | Réduction du stage + incrémentation des erreurs |
| Erreurs multiples                  | Pénalité de progression appliquée               |

### Calcul de la Pénalité d'Erreurs

$$\text{Pénalité} = \max(0.25, \frac{1}{1 + \text{errorCount} \times 0.2})$$

Cette formule récompense les cartes avec peu d'erreurs et ralentit la progression des cartes problématiques.
