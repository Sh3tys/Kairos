const express = require("express");
const {
  createCard,
  getCardsByDeck,
  updateCard,
  deleteCard,
} = require("../controllers/card.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);

router.post("/", createCard);
router.get("/deck/:deck_id", getCardsByDeck);
router.put("/:id", updateCard);
router.delete("/:id", deleteCard);

module.exports = router;
