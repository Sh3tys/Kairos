const express = require("express");
const {
  startReview,
  submitAnswer,
} = require("../controllers/review.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);

router.get("/start/:deckId", startReview);
router.post("/submit/:deckId/:cardId", submitAnswer);

module.exports = router;
