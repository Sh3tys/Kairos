const express = require("express");
const { verifyToken } = require("../middleware/auth.middleware");
const User = require("../models/user.model");

const router = express.Router();

router.use(verifyToken);

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "username email role createdAt",
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

module.exports = router;
