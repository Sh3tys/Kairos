const Card = require("../models/card.model");
const Deck = require("../models/deck.model");
const algo = require("../algorithm/algo");

const formatTime = (ms) => {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

const getNextIntervals = (card) => {
  const successResult = algo.processAnswer(card, true);
  const failureResult = algo.processAnswer(card, false);

  const successInterval =
    new Date(successResult.expirationDate).getTime() - Date.now();
  const failureInterval =
    new Date(failureResult.expirationDate).getTime() - Date.now();

  return {
    successTime: formatTime(successInterval),
    failureTime: formatTime(failureInterval),
  };
};

const startReview = async (req, res) => {
  try {
    const { deckId } = req.params;

    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ error: "Deck not found" });
    }

    if (deck.user_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const allCards = await Card.find({ deck_id: deckId });
    const studyQueue = algo.getStudyQueue(allCards);

    if (studyQueue.length === 0) {
      return res.json({
        message: "No cards to review",
        deck,
        finished: true,
      });
    }

    const currentCard = studyQueue[0];
    const intervals = getNextIntervals(currentCard);

    res.json({
      deck,
      card: currentCard,
      queuePosition: 1,
      queueLength: studyQueue.length,
      nextIntervals: intervals,
    });
  } catch (error) {
    console.error("Review start error:", error);
    res.status(500).json({ error: "Failed to start review" });
  }
};

const submitAnswer = async (req, res) => {
  try {
    const { deckId, cardId } = req.params;
    const { success } = req.body;

    if (success === undefined || success === null) {
      return res.status(400).json({ error: "Success field required" });
    }

    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ error: "Deck not found" });
    }

    if (deck.user_id.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const card = await Card.findById(cardId);
    if (!card || card.deck_id.toString() !== deckId) {
      return res.status(404).json({ error: "Card not found or invalid deck" });
    }

    const successBool = success === true || success === "true";
    const updatedData = algo.processAnswer(card, successBool);

    const updatedCard = await Card.findByIdAndUpdate(cardId, updatedData, {
      new: true,
    });

    const allCards = await Card.find({ deck_id: deckId });
    const studyQueue = algo.getStudyQueue(allCards);
    const remainingCards = studyQueue.filter(
      (c) => c._id.toString() !== cardId,
    );

    if (remainingCards.length === 0) {
      return res.json({
        message: "Review completed",
        finished: true,
        deck,
      });
    }

    const nextCard = remainingCards[0];
    const intervals = getNextIntervals(nextCard);

    res.json({
      message: "Answer submitted",
      updatedCard,
      nextCard,
      queuePosition: 1,
      queueLength: remainingCards.length,
      nextIntervals: intervals,
    });
  } catch (error) {
    console.error("Submit answer error:", error);
    res.status(500).json({ error: "Failed to submit answer" });
  }
};

module.exports = {
  startReview,
  submitAnswer,
};
