const mongoose = require("mongoose");

const MAX_STAGE = 12;

const cardSchema = new mongoose.Schema(
  {
    deck_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deck",
      required: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    expirationDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    stage: {
      type: Number,
      required: true,
      min: 0,
      max: MAX_STAGE,
      default: 0,
    },
    errorCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    consecutiveCorrect: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: Number,
      required: true,
      enum: [0, 1, 2],
      default: 0,
      index: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Card", cardSchema);
