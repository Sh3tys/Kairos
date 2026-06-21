const Card = require("../models/card.model");
const Deck = require("../models/deck.model");
const algo = require("../algorithm/algo");
const mongoose = require("mongoose");

const DEFAULT_HF_MODEL_ID =
  process.env.HF_MODEL_ID?.trim() || "Qwen/Qwen2.5-7B-Instruct:cheapest";
const DEFAULT_HF_MODEL_IDS = [
  ...(process.env.HF_MODEL_IDS?.split(",") || []),
  DEFAULT_HF_MODEL_ID,
  "Qwen/Qwen2.5-7B-Instruct:fastest",
  "HuggingFaceH4/zephyr-7b-beta:cheapest",
].map((modelId) => modelId.trim()).filter(Boolean);

const QUESTION_STYLE_POOL = [
  {
    name: "definition",
    label: "Definition",
    instruction: "Ask for a precise definition of one concept.",
  },
  {
    name: "gap_fill",
    label: "Gap fill",
    instruction: "Ask for a missing word or form in a sentence.",
  },
  {
    name: "correction",
    label: "Correction",
    instruction: "Ask the user to identify and correct a mistake.",
  },
  {
    name: "comparison",
    label: "Comparison",
    instruction: "Compare two close concepts or forms.",
  },
  {
    name: "example",
    label: "Example",
    instruction: "Ask for an original example that applies the rule.",
  },
  {
    name: "why_how",
    label: "Why / How",
    instruction: "Ask why the rule exists or how it works.",
  },
  {
    name: "transformation",
    label: "Transformation",
    instruction: "Ask to transform a sentence or form.",
  },
  {
    name: "classification",
    label: "Classification",
    instruction: "Ask to classify or identify the correct category.",
  },
  {
    name: "application",
    label: "Application",
    instruction: "Ask the user to apply the rule in context.",
  },
  {
    name: "true_false",
    label: "True / False",
    instruction: "Ask a true/false question with justification.",
  },
];

const DIFFICULTY_POOL = ["easy", "medium", "hard"];

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

const buildSourceExcerpt = (input, maxLength = 2200) =>
  String(input || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

const getStyleForIndex = (index) =>
  QUESTION_STYLE_POOL[index % QUESTION_STYLE_POOL.length];

const getDifficultyForIndex = (index) =>
  DIFFICULTY_POOL[index % DIFFICULTY_POOL.length];

const extractJsonArray = (text) => {
  const content = String(text || "");
  const jsonStart = content.indexOf("[");
  const jsonEnd = content.lastIndexOf("]");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error("Invalid response format from API");
  }

  let jsonStr = content.substring(jsonStart, jsonEnd + 1).replace(/\s+/g, " ");

  try {
    return JSON.parse(jsonStr);
  } catch (parseError) {
    jsonStr = jsonStr.replace(/\\([^"\\\/bfnrtu])/g, "$1");
    return JSON.parse(jsonStr);
  }
};

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

const callHuggingFaceAPI = async (
  messages,
  { temperature = 0.7, modelIds = DEFAULT_HF_MODEL_IDS } = {},
) => {
  const token = process.env.HUGGINGFACE_API_TOKEN?.trim();
  if (!token) {
    throw new Error("HuggingFace API token not configured");
  }

  let lastError = null;

  for (const modelId of modelIds) {
    try {
      const response = await fetch(
        "https://router.huggingface.co/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model: modelId,
            messages,
            max_tokens: 1400,
            temperature,
            stream: false,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || "";
      return extractJsonArray(text);
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error("All Hugging Face model attempts failed");
};

const buildBlueprintPrompt = (input, numberOfCards, mode, existingQuestions) => {
  const sourceExcerpt = buildSourceExcerpt(input, 2200);
  const knownQuestions = existingQuestions.length
    ? existingQuestions.map((question) => `- ${question}`).join("\n")
    : "- none";

  return [
    "You are designing a set of distinct study slides.",
    `Create exactly ${numberOfCards} blueprint objects for flashcards based on the source material below.`,
    "Every blueprint must target a different subtopic, skill, or rule.",
    "Avoid repeating the same concept in different wording.",
    "The blueprints will later be turned into flashcards one by one.",
    `Mode: ${mode}`,
    "",
    "Source material:",
    sourceExcerpt,
    "",
    "Existing questions to avoid:",
    knownQuestions,
    "",
    "Return ONLY a valid JSON array of objects with this shape:",
    `[{"focus":"distinct topic","angle":"what this slide should test","difficulty":"${DIFFICULTY_POOL.join(
      " | ",
    )}"}]`,
  ].join("\n");
};

const buildCardPrompt = ({
  input,
  mode,
  blueprint,
  usedQuestions,
  existingQuestions,
}) => {
  const sourceExcerpt = buildSourceExcerpt(input, 2200);
  const usedQuestionsList = [...existingQuestions, ...usedQuestions]
    .slice(-25)
    .map((question) => `- ${question}`)
    .join("\n");

  return [
    "You are creating a single study slide.",
    "The slide must be genuinely different from previous slides.",
    `Mode: ${mode}`,
    `Assigned question style: ${blueprint.style.label}`,
    `Style instruction: ${blueprint.style.instruction}`,
    `Target focus: ${blueprint.focus}`,
    `Angle: ${blueprint.angle}`,
    `Difficulty: ${blueprint.difficulty}`,
    "",
    "Source material:",
    sourceExcerpt,
    "",
    "Questions already used in this deck:",
    usedQuestionsList || "- none",
    "",
    "Rules:",
    "- Create exactly one flashcard as a JSON array with one object.",
    "- The question must not be semantically similar to any used question.",
    "- Keep the slide tightly focused on the target focus.",
    "- Make the answer concise but complete.",
    "- Do not add explanations outside JSON.",
    "Return ONLY valid JSON.",
    "Format:",
    '[{"question":"...","answer":"..."}]',
  ].join("\n");
};

const generateBlueprints = async (input, numberOfCards, mode, existingQuestions) => {
  const messages = [
    {
      role: "system",
      content:
        "You design varied study blueprints. Always return valid JSON arrays. Keep each blueprint distinct.",
    },
    {
      role: "user",
      content: buildBlueprintPrompt(input, numberOfCards, mode, existingQuestions),
    },
  ];

  const blueprints = await callHuggingFaceAPI(messages, { temperature: 0.6 });

  return blueprints
    .filter((item) => item && item.focus && item.angle)
    .slice(0, numberOfCards)
    .map((item, index) => ({
      focus: String(item.focus).trim(),
      angle: String(item.angle).trim(),
      difficulty:
        DIFFICULTY_POOL.indexOf(String(item.difficulty).toLowerCase()) >= 0
          ? String(item.difficulty).toLowerCase()
          : getDifficultyForIndex(index),
      style: getStyleForIndex(index),
    }));
};

const generateCardForBlueprint = async ({
  input,
  mode,
  blueprint,
  usedQuestions,
  existingQuestions,
}) => {
  const messages = [
    {
      role: "system",
      content:
        "You create one flashcard at a time and always return a valid JSON array with one object.",
    },
    {
      role: "user",
      content: buildCardPrompt({
        input,
        mode,
        blueprint,
        usedQuestions,
        existingQuestions,
      }),
    },
  ];

  const cards = await callHuggingFaceAPI(messages, { temperature: 0.85 });
  return cards
    .filter((item) => item && item.question && item.answer)
    .slice(0, 1)
    .map((item) => ({
      question: String(item.question).trim(),
      answer: String(item.answer).trim(),
    }));
};

const generateDistinctCards = async ({
  input,
  numberOfCards,
  mode,
  existingQuestions = [],
}) => {
  const blueprints = await generateBlueprints(
    input,
    numberOfCards,
    mode,
    existingQuestions,
  );

  if (blueprints.length < numberOfCards) {
    throw new Error("Failed to build enough distinct slide blueprints");
  }

  const usedQuestions = new Set(existingQuestions.map(normalizeText));
  const generatedCards = [];

  for (const blueprint of blueprints) {
    let attempts = 0;
    let generatedCard = null;

    while (attempts < 3 && !generatedCard) {
      const [candidate] = await generateCardForBlueprint({
        input,
        mode,
        blueprint,
        usedQuestions: generatedCards.map((card) => card.question),
        existingQuestions,
      });

      if (!candidate) {
        attempts += 1;
        continue;
      }

      const normalizedQuestion = normalizeText(candidate.question);
      const normalizedAnswer = normalizeText(candidate.answer);

      const isDuplicate =
        usedQuestions.has(normalizedQuestion) ||
        generatedCards.some(
          (card) =>
            normalizeText(card.question) === normalizedQuestion ||
            normalizeText(card.answer) === normalizedAnswer,
        );

      if (!isDuplicate) {
        generatedCard = candidate;
        usedQuestions.add(normalizedQuestion);
        generatedCards.push(candidate);
        break;
      }

      attempts += 1;
    }

    if (!generatedCard) {
      throw new Error(
        "Unable to generate enough distinct slides. Please try a more specific prompt.",
      );
    }
  }

  return generatedCards;
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

const getExistingQuestionsForDeck = async (deckId) => {
  const existingCards = await Card.find({ deck_id: deckId }).select("question");
  return existingCards.map((card) => card.question);
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

    const existingQuestions = await getExistingQuestionsForDeck(deck_id);

    const generatedCards = await generateDistinctCards({
      input: promptValidation.text,
      numberOfCards,
      mode: "prompt",
      existingQuestions,
    });

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

    const existingQuestions = await getExistingQuestionsForDeck(deck_id);

    const generatedCards = await generateDistinctCards({
      input: textValidation.text,
      numberOfCards,
      mode: "text",
      existingQuestions,
    });

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
