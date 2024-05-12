const { Violation } = require("../models/violation");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/studentViolation", async (req, res) => {
  try {
    const violationList = await Violation.find().populate({
      path: "user",
      select: "firstname lastname email grade",
    });
    console.log("Violation List", violationList);

    res.status(200).json(violationList);
  } catch (error) {
    console.error("Error fetching violation items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const { user, type, date, description } = req.body;

  try {
    // Check if the user exists
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(400).json({ error: "User not found" });
    }

    const { lastname, grade } = userExists; // Fetch lastname and grade from the user

    const violation = new Violation({
      date,
      user,
      lastname, // Include lastname in violation
      grade, // Include grade in violation
      type,
      description,
      dateCreated: new Date(),
    });

    const savedViolation = await violation.save();
    res.status(201).json(savedViolation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/userViolation/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userViolation = await Violation.find({ user: userId }).populate({
      path: "user",
    });

    console.log(userViolation, "fransssssss");
    res.status(200).json(userViolation);
  } catch (error) {
    console.error("Error fetching user Violation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const violatios = await Violation.find().populate("user");
    res.status(200).json(violatios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// router.get("/:id", async (req, res) => {
//   if (!mongoose.isValidObjectId(req.params.id)) {
//     return res.status(400).send("Invalid Violation Id");
//   }

//   try {
//     const violation = await Violation.findById(req.params.id).populate("user");
//     if (!violation) {
//       return res.status(404).json({ message: "Violation not found" });
//     }
//     res.status(200).json(violation);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

router.delete("/:id", (req, res) => {
  Violation.findByIdAndRemove(req.params.id)
    .then((violation) => {
      if (violation) {
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

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Violation Id");
    }

    const violation = await Violation.findById(req.params.id);

    if (!violation) {
      return res.status(404).send("Violation not found");
    }

    violation.date = req.body.date;

    await violation.save();

    res.json(violation);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});


router.put("/update-violation-status/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Violation ID");
    }

    const violation = await Violation.findById(req.params.id).populate("user");

    if (!violation) {
      return res.status(404).json({ error: "Violation not found" });
    }

    const user = await User.findById(req.body.user);

    if (!user) {
      return res.status(400).send("Invalid User!");
    }

    // Update violation status
    violation.status = req.body.status;

    // Push new log entry
    const updateStatus = await Violation.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { status: req.body.status }, // Update violation status
        $push: {
          violationLogs: { // Push new violation log entry
            studentName: user.lastname,
            violationInfo: violation.type,
            status: req.body.status,
            recordBy: req.body.guidanceRole, // Ensure guidance role is defined
          },
        },
      },
      { new: true } // Return the updated document
    );

    if (!updateStatus) {
      return res.status(500).send("The violation status cannot be updated!");
    } else {
      res.send(updateStatus);
    }
  } catch (error) {
    console.error("Error updating violation status:", error);
    res.status(500).send("Internal Server Error");
  }
});



router.get("/violationLogs", async (req, res) => {
  try {
    // Find all violations and populate the violationLogs field
    const allViolations = await Violation.find({}).populate('violationLogs');

    if (!allViolations || allViolations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No violation logs found",
      });
    }

    let allViolationLogs = [];

    // Extract violationLogs from each violation and concatenate into a single array
    allViolations.forEach((violation) => {
      allViolationLogs = allViolationLogs.concat(violation.violationLogs);
    });

    if (allViolationLogs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Violation logs found for any user",
      });
    }

    // Sort the allViolationLogs array by timestamp (assuming the timestamp field is called 'createdAt')
    allViolationLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, violationLogs: allViolationLogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});




module.exports = router;
