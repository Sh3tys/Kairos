const Deck = require("../models/deck.model");
const Card = require("../models/card.model");

const verifyDeckOwnership = async (deckId, userId) => {
  const deck = await Deck.findById(deckId);
  if (!deck) return { valid: false, error: "Deck not found", status: 404 };
  if (deck.user_id.toString() !== userId.toString()) {
    return { valid: false, error: "Unauthorized", status: 403 };
  }
  return { valid: true, deck };
};

const getAllDecks = async (req, res) => {
  try {
    const decks = await Deck.find({ user_id: req.userId });
    res.json({ decks });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch decks" });
  }
};

const getDeckById = async (req, res) => {
  try {
    const deckVerification = await verifyDeckOwnership(
      req.params.id,
      req.userId,
    );
    if (!deckVerification.valid) {
      return res
        .status(deckVerification.status)
        .json({ error: deckVerification.error });
    }

    const deck = deckVerification.deck;
    const cards = await Card.find({ deck_id: req.params.id });
    res.json({ deck, cards });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch deck" });
  }
};

const createDeck = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const deck = await Deck.create({
      title,
      description: description || "",
      user_id: req.userId,
    });

    res.status(201).json({ message: "Deck created", deck });
  } catch (error) {
    res.status(500).json({ error: "Failed to create deck" });
  }
};

const updateDeck = async (req, res) => {
  try {
    const deckVerification = await verifyDeckOwnership(
      req.params.id,
      req.userId,
    );
    if (!deckVerification.valid) {
      return res
        .status(deckVerification.status)
        .json({ error: deckVerification.error });
    }

    const updatedDeck = await Deck.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ message: "Deck updated", deck: updatedDeck });
  } catch (error) {
    res.status(500).json({ error: "Failed to update deck" });
  }
};

const deleteDeck = async (req, res) => {
  try {
    const deckVerification = await verifyDeckOwnership(
      req.params.id,
      req.userId,
    );
    if (!deckVerification.valid) {
      return res
        .status(deckVerification.status)
        .json({ error: deckVerification.error });
    }

    await Card.deleteMany({ deck_id: req.params.id });
    await Deck.findByIdAndDelete(req.params.id);
    res.json({ message: "Deck deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete deck" });
  }
};

module.exports = {
  getAllDecks,
  getDeckById,
  createDeck,
  updateDeck,
  deleteDeck,
};
