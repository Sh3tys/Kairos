const Card = require("../models/card.model");
const Deck = require("../models/deck.model");
const algo = require("../algorithm/algo");
const mongoose = require("mongoose");

const createCard = async (req, res) => {
  try {
    const { question, answer, deck_id } = req.body;

    if (!question || !answer || !deck_id) {
      return res
        .status(400)
        .json({ error: "Question, answer, and deck_id required" });
    }

    if (!mongoose.Types.ObjectId.isValid(deck_id)) {
      return res.status(400).json({ error: "Invalid deck_id" });
    }

    const deck = await Deck.findById(deck_id);
    if (!deck) {
      return res.status(404).json({ error: "Deck not found" });
    }

    if (deck.user_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const card = await Card.create({
      question: question.trim(),
      answer: answer.trim(),
      deck_id,
      ...algo.initCardDefaults(),
    });

    res.status(201).json({ message: "Card created", card });
  } catch (error) {
    console.error("Card creation error:", error);
    res.status(500).json({ error: "Failed to create card" });
  }
};

const getCardsByDeck = async (req, res) => {
  try {
    const { deck_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(deck_id)) {
      return res.status(400).json({ error: "Invalid deck_id" });
    }

    const deck = await Deck.findById(deck_id);
    if (!deck) {
      return res.status(404).json({ error: "Deck not found" });
    }

    if (deck.user_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const cards = await Card.find({ deck_id });
    res.json({ cards });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch cards" });
  }
};

const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Question and answer required" });
    }

    const card = await Card.findById(id).populate("deck_id");
    if (!card || !card.deck_id) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.deck_id.user_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    card.question = question.trim();
    card.answer = answer.trim();
    await card.save();

    res.json({ message: "Card updated", card });
  } catch (error) {
    res.status(500).json({ error: "Failed to update card" });
  }
};

const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await Card.findById(id).populate("deck_id");
    if (!card || !card.deck_id) {
      return res.status(404).json({ error: "Card not found" });
    }

    if (card.deck_id.user_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Card.findByIdAndDelete(id);
    res.json({ message: "Card deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete card" });
  }
};

module.exports = {
  createCard,
  getCardsByDeck,
  updateCard,
  deleteCard,
};
