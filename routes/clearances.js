const express = require("express");
const { Clearance } = require("../models/clearance");
const { User } = require ("../models/user");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

// router.post("/", uploadOptions.any(), async (req, res) => {
//   console.log("req body", req.body);

//   try {
//     const file = req.files;
//     console.log("file", file);
//     if (!file) return res.status(400).send("no image in the clearance");

//     const clearanceImages = req.files.filter(
//       (file) => file.fieldname === "clearanceImages" // Updated fieldname to match frontend
//     );

//     // Upload image to Cloudinary
//     const cloudinaryFolderOption = {
//       folder: "Clearance of Students",
//       crop: "scale",
//     };

//     let imageClearance = [];

//     if (clearanceImages.length > 0) {
//       const clearanceResult = await cloudinary.v2.uploader.upload(
//         clearanceImages[0].path, // Corrected variable name
//         cloudinaryFolderOption
//       );

//       imageClearance = {
//         public_id: clearanceResult.public_id,
//         url: clearanceResult.secure_url,
//       };
//     }

//     const user = req.body.user;
//     const uploadedAt = req.body.uploadedAt;

//     const clearance = new Clearance({
//       uploadedAt: uploadedAt,
//       user: user,
//       clearanceImages: imageClearance,
//     });

//     console.log("SCREENSHOT", clearance)

//     const savedClearance = await clearance.save();

//     res.send(savedClearance);
//   } catch (error) {
//     console.error("Error creating clearance:", error);
//     res.status(500).send("Error creating clearance!");
//   }
// });

router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("No image in the request");

    // File upload successful, now upload to Cloudinary
    const cloudinaryFolderOption = {
      folder: "Clearance of Students",
      crop: "scale",
    };

    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );

    // Create a new clearance instance with the uploaded file information
    const clearance = new Clearance({
      user: req.body.user,
      uploadedAt: req.body.uploadedAt,
      clearanceImages: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    });

    // Save the clearance to the database
    const savedClearance = await clearance.save();

    if (!savedClearance) {
      return res.status(500).send("The clearance cannot be created");
    }

    res.send(savedClearance);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during clearance creation");
  }
});


router.get("/studentClearance", async (req, res) => {
  try {
    const clearanceList = await Clearance.find().populate({
      path: "user",
      select: "firstname lastname email grade",
    });
    console.log("CLEARANCE LIST", clearanceList)

    res.status(200).json(clearanceList);
  } catch (error) {
    console.error("Error fetching clearance items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const clearanceList = await Clearance.find();
    if (!clearanceList || clearanceList.length === 0) {
      return res.status(404).json({ message: "No clearance items found" });
    }
    res.status(200).json(clearanceList);
  } catch (err) {
    console.error("Error fetching clearance items:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Clearance Id");
  }

  try {
    const clearance = await Clearance.findById(req.params.id).populate("user");
    if (!clearance) {
      return res.status(404).json({ message: "Clearance not found" });
    }
    res.status(200).json(clearance);
  } catch (err) {
    console.error("Error fetching clearance item:", err);
    res.status(500).json({ error: err.message });
  }
});

// router.get("/userClearance/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const userClearance = await Clearance.find({ user: userId })
//       .populate({
//         path: "user",
//       })
     
//     console.log(userClearance,"fransssssss")
//     res.status(200).json(userClearance);
//   } catch (error) {
//     console.error("Error fetching user Clearance:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });



// router.get(`/get/userClearance/:userid`, async (req, res) => {
//   const userClearanceList = await Clearance.find({
//     user: req.params.userid,
//   })
//     .populate({
//       path: "userClearance",
//       populate: {
//         path: "clearance",
//       },
//     })
//     .sort({ DateTime: -1 });

//   if (!userClearanceList) {
//     res.status(500).json({ success: false });
//   }
//   res.send(userClearanceList);
// });

router.delete("/:id", (req, res) => {
  Clearance.findByIdAndRemove(req.params.id)
    .then((clearance) => {
      if (clearance) {
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
      return res.status(400).send("Invalid Clearance Id");
    }

  
    const clearance = await Clearance.findById(req.params.id);

    if (!clearance) {
      return res.status(404).send("Clearance not found");
    }

    clearance.uploadedAt = req.body.uploadedAt;

    await clearance.save();

    res.json(clearance);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
// router.get("/userClearance/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;
//     console.log(userId);

//     const user = await User.findById(userId);
//     console.log(user, "user");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const userClearance = await Clearance.find({ user: userId })
//       .populate({
//         path: "user",
//       })
//       .populate({
//         path: "userClearance",
//         populate: { path: "clearance", model: "Clearance" },
//       });

//     res.status(200).json(userClearance);
//   } catch (error) {
//     console.error("Error fetching user clearance:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

module.exports = router;
