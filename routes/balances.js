const { Balance } = require("../models/balance");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const balances = await Balance.find().populate("user");
    res.status(200).json(balances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new balance entry
router.post("/", async (req, res) => {
  const { user, amount, specificBalance } = req.body;

  try {
    // Fetch the user's information including lastname and grade
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(400).json({ error: "User not found" });
    }

    const { lastname, grade } = userExists;

    // Create the balance entry with user's information
    const balance = new Balance({
      user,
      lastname,
      grade,
      amount,
      specificBalance,
      createdAt: Date.now(),
    });

    const newBalance = await balance.save();
    res.status(201).json(newBalance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create balance entry" });
  }
});

// Get all balances with user details
router.get("/studentBalance", async (req, res) => {
  try {
    const balanceList = await Balance.find().populate({
      path: "user",
      select: "lastname firstname grade role",
    });
    res.status(200).json(balanceList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get balance by user ID
router.get("/userBalance/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userBalance = await Balance.find({ user: userId }).populate("user");
    res.status(200).json(userBalance);
  } catch (error) {
    console.error("Error fetching user Balance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update balance by ID
router.put("/:id", async (req, res) => {
  try {
    const balance = await Balance.findByIdAndUpdate(
      req.params.id,
      {
        amount: req.body.amount,
        specificBalance: req.body.specificBalance,
      },
      { new: true }
    );

    if (!balance) {
      return res.status(400).send("The balance cannot be updated!");
    }

    res.send(balance);
  } catch (error) {
    console.error("Error updating balance:", error);
    res.status(500).json({ error: "Failed to update balance" });
  }
});

router.delete("/:id", (req, res) => {
  Balance.findByIdAndRemove(req.params.id)
    .then((balance) => {
      if (balance) {
        return res
          .status(200)
          .json({ success: true, message: "the user is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "user not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
