const express = require("express");
const {
  getAllDecks,
  getDeckById,
  createDeck,
  updateDeck,
  deleteDeck,
} = require("../controllers/deck.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);

router.get("/", getAllDecks);
router.post("/", createDeck);
router.get("/:id", getDeckById);
router.put("/:id", updateDeck);
router.delete("/:id", deleteDeck);

module.exports = router;
