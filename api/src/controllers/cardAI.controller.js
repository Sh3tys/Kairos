const Card = require("../models/card.model");
const Deck = require("../models/deck.model");
const algo = require("../algorithm/algo");
const mongoose = require("mongoose");

const validateDeckOwnership = async (deckId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(deckId)) {
    return { valid: false, error: "Invalid deck ID" };
  }
  const deck = await Deck.findById(deckId);
  if (!deck) {
    return { valid: false, error: "Deck not found" };
  }
  if (deck.user_id.toString() !== userId.toString()) {
    return { valid: false, error: "Unauthorized" };
  }
  return { valid: true, deck };
};

const validateInput = (text, minLength, maxLength, fieldName) => {
  if (!text || text.trim().length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must have at least ${minLength} characters`,
    };
  }
  if (text.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} cannot exceed ${maxLength} characters`,
    };
  }
  return { valid: true, text: text.replace(/\s+/g, " ").trim() };
};

const callHuggingFaceAPI = async (input, numberOfCards, mode) => {
  const token = process.env.HUGGINGFACE_API_TOKEN?.trim();
  if (!token) {
    throw new Error("HuggingFace API token not configured");
  }

  const prompt =
    mode === "prompt"
      ? `Generate exactly ${numberOfCards} flashcard pairs about: "${input}"\n\nVary difficulty: Easy → Medium → Hard\n\nReturn ONLY valid JSON:\n[{"question": "Easy?", "answer": "Answer"}]`
      : `Generate exactly ${numberOfCards} question-answer pairs from this text:\n\n${input.substring(
          0,
          1500,
        )}\n\nReturn ONLY valid JSON:\n[{"question": "q?", "answer": "a"}]`;

  const response = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [
          {
            role: "system",
            content:
              "You are an expert at creating flashcard questions and answers. Always respond with a valid JSON array of objects with 'question' and 'answer' fields.",
          },
          { role: "user", content: prompt },
        ],
        max_tokens: Math.min(8000, numberOfCards * 120 + 500),
        temperature: 0.7,
        stream: false,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`API Error ${response.status}`);
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content || "";
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]");

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Invalid response format from API");
  }

  let jsonStr = text
    .substring(jsonStart, jsonEnd + 1)
    .replace(/\n/g, " ")
    .replace(/\r/g, " ")
    .replace(/\t/g, " ");

  let cards;
  try {
    cards = JSON.parse(jsonStr);
  } catch (parseError) {
    jsonStr = jsonStr.replace(/\\([^"\\\/bfnrtu])/g, "$1");
    try {
      cards = JSON.parse(jsonStr);
    } catch (parseError2) {
      throw new Error("Failed to parse API response");
    }
  }

  cards = cards
    .filter((c) => c.question && c.answer)
    .slice(0, numberOfCards)
    .map((c) => ({
      question: String(c.question).trim(),
      answer: String(c.answer).trim(),
    }));

  if (cards.length === 0) {
    throw new Error("No valid cards generated from API");
  }

  return cards;
};

const generateAndSaveCards = async (userId, deck, cardsData) => {
  const savedCards = [];

  for (const cardData of cardsData) {
    if (!cardData.question || !cardData.answer) {
      continue;
    }

    const existingQuestion = await Card.findOne({
      question: cardData.question,
      deck_id: deck._id,
    });

    if (existingQuestion) {
      continue;
    }

    const card = await Card.create({
      question: cardData.question,
      answer: cardData.answer,
      deck_id: deck._id,
      ...algo.initCardDefaults(),
    });

    savedCards.push(card);
  }

  return savedCards;
};

const generateCardsFromPrompt = async (req, res) => {
  try {
    const { prompt, numberOfCards, deck_id } = req.body;

    if (!prompt || !numberOfCards || !deck_id) {
      return res
        .status(400)
        .json({ error: "Prompt, numberOfCards, and deck_id required" });
    }

    const promptValidation = validateInput(prompt, 10, 2000, "Prompt");
    if (!promptValidation.valid) {
      return res.status(400).json({ error: promptValidation.error });
    }

    if (numberOfCards < 1 || numberOfCards > 50) {
      return res
        .status(400)
        .json({ error: "Number of cards must be between 1 and 50" });
    }

    const deckValidation = await validateDeckOwnership(deck_id, req.userId);
    if (!deckValidation.valid) {
      return res.status(403).json({ error: deckValidation.error });
    }

    const generatedCards = await callHuggingFaceAPI(
      promptValidation.text,
      numberOfCards,
      "prompt",
    );
    const savedCards = await generateAndSaveCards(
      req.userId,
      deckValidation.deck,
      generatedCards,
    );

    res.status(201).json({
      message: "Cards generated successfully",
      cardsGenerated: generatedCards.length,
      cardsSaved: savedCards.length,
      cards: savedCards,
    });
  } catch (error) {
    console.error("Generate from prompt error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate cards" });
  }
};

const generateCardsFromText = async (req, res) => {
  try {
    const { text, numberOfCards, deck_id } = req.body;

    if (!text || !numberOfCards || !deck_id) {
      return res
        .status(400)
        .json({ error: "Text, numberOfCards, and deck_id required" });
    }

    const textValidation = validateInput(text, 50, 5000, "Text");
    if (!textValidation.valid) {
      return res.status(400).json({ error: textValidation.error });
    }

    if (numberOfCards < 1 || numberOfCards > 50) {
      return res
        .status(400)
        .json({ error: "Number of cards must be between 1 and 50" });
    }

    const deckValidation = await validateDeckOwnership(deck_id, req.userId);
    if (!deckValidation.valid) {
      return res.status(403).json({ error: deckValidation.error });
    }

    const generatedCards = await callHuggingFaceAPI(
      textValidation.text,
      numberOfCards,
      "text",
    );
    const savedCards = await generateAndSaveCards(
      req.userId,
      deckValidation.deck,
      generatedCards,
    );

    res.status(201).json({
      message: "Cards generated successfully",
      cardsGenerated: generatedCards.length,
      cardsSaved: savedCards.length,
      cards: savedCards,
    });
  } catch (error) {
    console.error("Generate from text error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to generate cards" });
  }
};

module.exports = {
  generateCardsFromPrompt,
  generateCardsFromText,
};
