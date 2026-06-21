const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth.route");
const deckRoutes = require("./src/routes/deck.route");
const cardRoutes = require("./src/routes/card.route");
const reviewRoutes = require("./src/routes/review.route");
const cardAIRoutes = require("./src/routes/cardAI.route");
const userRoutes = require("./src/routes/user.route");

const app = express();

const dbConnectionPromise = connectDB().catch((error) => {
  console.error("MongoDB initialization failed:", error);
  throw error;
});

app.use(helmet());

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((u) => u.trim())
  : ["http://localhost:3000"];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(morgan("combined"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "API is running" });
});

app.use(async (req, res, next) => {
  try {
    await dbConnectionPromise;
    next();
  } catch (error) {
    next(error);
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/decks", deckRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/ai-cards", cardAIRoutes);
app.use("/api/user", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module && !process.env.VERCEL) {
  dbConnectionPromise
    .then(() => {
      app.listen(PORT, () => {
        console.log(`API server running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Unable to start API server:", error);
      process.exit(1);
    });
}

module.exports = app;
