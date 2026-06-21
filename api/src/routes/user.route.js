const express = require("express");
const { verifyToken } = require("../middleware/auth.middleware");
const User = require("../models/user.model");
const bcrypt = require("bcrypt");

const router = express.Router();

const passwordPolicy = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  hasSpecial: /[^A-Za-z0-9]/,
};

const validatePasswordStrength = (password) => {
  if (!password || password.length < passwordPolicy.minLength) {
    return "Password must be at least 8 characters long";
  }

  if (!passwordPolicy.hasUppercase.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!passwordPolicy.hasLowercase.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!passwordPolicy.hasNumber.test(password)) {
    return "Password must contain at least one number";
  }

  if (!passwordPolicy.hasSpecial.test(password)) {
    return "Password must contain at least one special character";
  }

  return null;
};

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

router.put("/profile", async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword, confirmPassword } =
      req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updates = {};

    if (username !== undefined) {
      const trimmedUsername = String(username).trim();
      if (!trimmedUsername) {
        return res.status(400).json({ error: "Username cannot be empty" });
      }
      updates.username = trimmedUsername;
    }

    if (email !== undefined) {
      const trimmedEmail = String(email).trim().toLowerCase();
      if (!trimmedEmail) {
        return res.status(400).json({ error: "Email cannot be empty" });
      }

      const existingEmailUser = await User.findOne({
        email: trimmedEmail,
        _id: { $ne: user._id },
      });

      if (existingEmailUser) {
        return res.status(409).json({ error: "Email already exists" });
      }

      updates.email = trimmedEmail;
    }

    const passwordChangeRequested =
      newPassword !== undefined || confirmPassword !== undefined;

    if (passwordChangeRequested) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res
          .status(400)
          .json({ error: "Current password, new password and confirmation are required" });
      }

      const validCurrentPassword = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!validCurrentPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
      }

      const passwordError = validatePasswordStrength(newPassword);
      if (passwordError) {
        return res.status(400).json({ error: passwordError });
      }

      updates.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No changes provided" });
    }

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
    }).select("username email role createdAt updatedAt");

    return res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update profile" });
  }
});

module.exports = router;
