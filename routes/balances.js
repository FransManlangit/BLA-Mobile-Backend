const { Balance } = require("../models/balance");
const { User } = require("../models/user");  
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const multer = require("multer");



const upload = multer();

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
  const { user, amount, status, specificBalance } = req.body;

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
      status,
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
        status: req.body.status,
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

// Update balance status route

// router.put("/update-balance-status/:id", upload.none(), async (req, res) => {
//   try {
//     console.log("Updating balance status...");

//     // Log the entire request body
//     console.log("Request Body:", req.body);

//     if (!mongoose.isValidObjectId(req.params.id)) {
//       console.log("Invalid Balance ID");
//       return res.status(400).send("Invalid Balance ID");
//     }

//     const balance = await Balance.findById(req.params.id);
//     if (!balance) {
//       console.log("Balance not found");
//       return res.status(404).json({ error: "Balance not found" });
//     }

//     // Extract user ID and amount from the request body
//     const { user, amount } = req.body;

//     // Fetch user by ID
//     const fetchedUser = await User.findById(user);
//     if (!fetchedUser) {
//       console.log("Invalid User!");
//       return res.status(400).send("Invalid User!");
//     }

//     // Check if required data is missing
//     if (!amount) {
//       console.log("Missing amount in request body");
//       return res.status(400).send("Missing amount in request body");
//     }

//     // Update balance amount
//     const balanceChange = balance.amount + parseFloat(amount);
//     balance.amount = balanceChange;

//     // Create balance log
//     balance.balanceLogs.push({
//       studentName: fetchedUser.lastname,
//       amountPaid: balance.amount,
//       balanceInfo: balance.specificBalance,
//       status: amount > 0 ? "Paid" : "Unpaid",
//       by: `${fetchedUser.lastname} - ${fetchedUser.role}`,
//     });

//     // Save updated balance
//     const updatedBalance = await balance.save();

//     console.log(updatedBalance, "updatedBalance");
//     return res.json(updatedBalance);
//   } catch (error) {
//     console.error("Error updating balance:", error);
//     return res.status(500).send("Internal Server Error");
//   }
// });


// router.put("/update-balance-status/:id", async (req, res) => {
//   try {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//       return res.status(400).send("Invalid Balance ID");
//     }

//     // Find the balance by ID and populate the 'user' field to fetch the associated user
//     const balance = await Balance.findById(req.params.id).populate('user');

//     if (!balance) {
//       return res.status(404).json({ error: "Balance not found" });
//     }

//     const user = await User.findById(req.body.user);

//     if (!user) {
//       return res.status(400).send("Invalid User!");
//     }

//     // Calculate the new balance amount without adding the amountPaid
//     const newBalanceAmount = balance.amount;

//     const updateStatus = await Balance.findOneAndUpdate(
//       { _id: req.params.id },
//       {
//         $set: { amount: newBalanceAmount },
//         $push: {
//           balanceLogs: {
//             studentName: user.lastname,
//             balanceInfo: balance.specificBalance,
//             amountPaid: Math.abs(req.body.amount), // Save the absolute value of amountPaid
//             status: req.body.amount > 0 ? "Paid" : "Unpaid",
//             recordBy: req.body.cashierRole,
//           },
//         },
//       },
//       { new: true } // Return the updated document
//     );

//     console.log(updateStatus, "updateStatus");

//     if (!updateStatus) {
//       return res.status(500).send("The balance status cannot be updated!");
//     } else {
//       res.send(updateStatus);
//     }
//   } catch (error) {
//     console.error("Error updating balance status:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });



router.put("/update-balance-status/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Balance ID");
    }

    // Find the balance by ID and populate the 'user' field to fetch the associated user
    const balance = await Balance.findById(req.params.id).populate("user");

    if (!balance) {
      return res.status(404).json({ error: "Balance not found" });
    }

    const user = await User.findById(req.body.user);

    if (!user) {
      return res.status(400).send("Invalid User!");
    }

    // Calculate the new balance amount based on the payment
    let newBalanceAmount = balance.amount - req.body.amount;

    // Define the status based on the new balance amount and current status
    let status;
    if (newBalanceAmount === 0 && balance.status !== "Settled") {
      status = "Settled";
    } else {
      status = "Unsettled";
    }

    // Update the balance and push the payment details to logs
    const updateStatus = await Balance.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { amount: newBalanceAmount, status: status },
        $push: {
          balanceLogs: {
            studentName: user.lastname,
            balanceInfo: balance.specificBalance,
            amountPaid: req.body.amount,
            status: status,
            recordBy: req.body.cashierRole,
          },
        },
      },
      { new: true } // Return the updated document
    );

    if (!updateStatus) {
      return res.status(500).send("The balance status cannot be updated!");
    } else {
      res.send(updateStatus);
    }
  } catch (error) {
    console.error("Error updating balance status:", error);
    res.status(500).send("Internal Server Error");
  }
});






router.get("/balanceLogs", async (req, res) => {
  try {
    // Find all balances and populate the balanceLogs field
    const allBalances = await Balance.find({}).populate('balanceLogs');

    if (!allBalances || allBalances.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No balance logs found",
      });
    }

    let allBalanceLogs = [];

    // Extract balanceLogs from each balance and concatenate into a single array
    allBalances.forEach((balance) => {
      allBalanceLogs = allBalanceLogs.concat(balance.balanceLogs);
    });

    if (allBalanceLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No balance logs found for any user",
      });
    }

    // Sort the allBalanceLogs array by timestamp (assuming the timestamp field is called 'createdAt')
    allBalanceLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, balanceLogs: allBalanceLogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});


module.exports = router;
