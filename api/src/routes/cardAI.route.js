const express = require("express");
const {
  generateCardsFromPrompt,
  generateCardsFromText,
} = require("../controllers/cardAI.controller");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);

router.post("/prompt", generateCardsFromPrompt);
router.post("/text", generateCardsFromText);

module.exports = router;
