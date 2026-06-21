const express = require("express");
const { verifyToken } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(verifyToken);

router.get("/profile", (req, res) => {
  res.json({ message: "User profile endpoint" });
});

module.exports = router;
