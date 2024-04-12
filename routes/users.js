const { User } = require("../models/user");
const { Request } = require("../models/request");
const { Order } = require("../models/order");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ms.jonara@gmail.com",
    pass: "hjwdqipeaaulcppw",
  },
});

const isStrongPassword = (password) => {
  if (typeof password === "undefined") {
    return { strong: false, missingRequirements: ["Password is undefined"] };
  }

  if (password.length < 6) {
    return {
      strong: false,
      missingRequirements: ["Password must be at least 6 characters long"],
    };
  }

  return { strong: true };
};

const sendResetEmail = async (senderMail, token) => {
  try {
    await transporter.sendMail({
      from: "mcheaven4lyf@gmail.com",
      to: senderMail,
      subject: "Reset Password",
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Reset Password</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          header {
            text-align: center;
            margin-bottom: 20px;
          }
          header img {
            max-width: 200px;
            height: auto;
          }
          h1 {
            margin-top: 0;
          }
          footer {
            margin-top: 20px;
            text-align: center;
            font-size: 0.8em;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <img src="https://res.cloudinary.com/dn638duad/image/upload/v1708097036/pics/new-logo_hbgkkx.png" alt="Company Logo">
            <h1>Reset Password</h1>
          </header>
          <div id="project">
            <p>A request has been made to reset your password.</p>
            <p>Please use the following token to reset your password:</p>
            <h2>${token}</h2>
          </div>
          <footer>
            This email was sent from a computer and is valid without signature and seal.
          </footer>
        </div>
      </body>
      </html>
    `,
    });

    console.log("Reset email sent successfully");
  } catch (error) {
    console.error("Error sending reset email:", error);
  }
};

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

router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-password");
  console.log(userList);

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

// router.get(`/`, async (req, res) => {
//   console.log(req.query);
//   const userList = await User.find();

//   if (!userList) {
//     res.status(500).json({ success: false });
//   }

//   res.send(userList);
// });

router.get(`/approvedRequests`, async (req, res) => {
  try {
    // Find all request items with status 'approved' and populate associated user and document data
    const approvedRequests = await Request.find({ requestStatus: "Approved" })
      .populate({
        path: "user",
        select: "firstname lastname email grade role",
        match: { role: { $in: ["alumni", "student"] } }, // Filter users by role
      })
      .populate({
        path: "requestItems.document",
        model: "Document",
      });

    // Filter out requests with null or undefined user objects
    const filteredRequests = approvedRequests.filter(
      (item) => item.user !== null
    );

    // Log all users with the role of 'student' and 'alumni' who have made a request
    const usersWithRequests = filteredRequests.map((item) => item.user);

    console.log(JSON.stringify(usersWithRequests, null, 2)); // Log the users with requests

    res.status(200).json(filteredRequests);
  } catch (error) {
    console.error("Error fetching approved requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get(`/approvedOrders`, async (req, res) => {
  try {
    const approvedOrders = await Order.find({ orderStatus: "Approved" })
      .populate({
        path: "user",
        select: "firstname lastname email grade role",
        match: { role: { $in: ["alumni", "student"] } }, // Filter users by role
      })
      .populate({
        path: "orderItems.product",
        model: "Product",
      });

    const filteredOrders = approvedOrders.filter((item) => item.user !== null);

    const usersWithOrders = filteredOrders.map((item) => item.user);

    console.log(JSON.stringify(usersWithOrders, null, 2));

    res.status(200).json(filteredOrders);
  } catch (error) {
    console.error("Error fetching approved orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get(`/usersList`, async (req, res) => {
  const userList = await User.find({
    role: { $in: ["alumni", "student"] },
  }).select("-password");
  console.log(userList);

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    res
      .status(500)
      .json({ message: "The user with the given ID was not found." });
  }
  res.status(200).send(user);
});

router.post("/resetPassword", async (req, res) => {
  try {
    const email = req.body.email; // Get the email from the request body
    const existingUser = await User.findOne({ email }); // Query the user by email

    if (!existingUser) {
      console.error("User not found");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Generate a secure token
    const token = Math.floor(100000 + Math.random() * 900000);

    // Set reset token and expiration time
    existingUser.resettoken = token;
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1); // Set expiration time to 1 hour from now
    existingUser.resettokenExpiration = expirationTime;
    await existingUser.save();

    // Send reset email with the token
    await sendResetEmail(email, token);

    return res
      .status(200)
      .json({ success: true, message: "Reset token sent successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

router.post("/resetPasswordConfirm", async (req, res) => {
  try {
    const { email, verificationCode, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      console.log("User not found");
      return res
        .status(400)
        .json({ success: false, message: "User not found." });
    }

    // Fetch the verification code from the database
    const storedVerificationCode = user.resettoken;

    // Check if the verification code matches
    if (verificationCode !== storedVerificationCode) {
      console.log("Invalid verification code");
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code." });
    }

    // Check if the password meets strength requirements
    const passwordStrength = isStrongPassword(password);
    if (!passwordStrength.strong) {
      console.log(
        "Password does not meet strength requirements:",
        passwordStrength.missingRequirements
      );
      return res
        .status(400)
        .json({
          success: false,
          message: passwordStrength.missingRequirements.join("\n"),
        });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    // Clear the verification code after successful password reset
    user.resettoken = "";
    user.resettokenExpiration = null;

    await user.save();

    console.log("Password updated successfully");
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred. Please try again later.",
      });
  }
});

router.post("/", async (req, res) => {
  const existingEmail = await User.findOne({ email: req.body.email });
  if (existingEmail) {
    return res.status(400).send("Email already exists");
  }

  const existingPhone = await User.findOne({ phone: req.body.phone });
  if (existingPhone) {
    return res.status(400).send("Phone number already exists");
  }

  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);

  let password = await bcrypt.hashSync(req.body.password, salt);

  let user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    middlename: req.body.middlename,
    schoolId: req.body.schoolId,
    schoolYear: req.body.schoolYear,
    phone: req.body.phone,
    email: req.body.email,
    password: password,
    isAdmin: req.body.isAdmin,
  });

  user = await user.save();

  if (!user) return res.status(400).send("the user cannot be created!");

  res.semd(user);
});

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  console.log(req.body);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid User Id");
  }

  const users = await User.findById(req.params.id);
  if (!users) return res.status(400).send("Invalid User!");

  const file = req.file;
  let image;

  const cloudinaryFolderOption = {
    folder: "Student Profile",
    crop: "scale",
  };

  if (file) {
    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );
    image = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } else {
    image = user.avatar;
  }

  const userExist = await User.findById(req.params.id);
  let newPassword;
  if (req.body.password) {
    newPassword = bcrypt.hashSync(req.body.password, 10);
  } else {
    newPassword = userExist.password;
  }

  let newImage = userFind.avatar; // Initialize newImage variable

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      middlename: req.body.middlename,
      schoolId: req.body.schoolId,
      schoolYear: req.body.schoolYear,
      phone: req.body.phone,
      email: req.body.email,
      password: newPassword,
      role: req.body.role,
      avatar: newImage,
    },
    { new: true }
  );

  if (!user) return res.status(400).send("the user cannot be updated!");

  res.send(user);
});

router.put("/changePassword/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    // Retrieve the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Check if the current password provided by the user matches the stored password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordValid) {
      return res.status(400).send("Invalid current password");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    res.status(200).send("Password updated successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred while updating the password");
  }
});

router.post(`/admin`, uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("no image in the request");

    // Upload category images to Cloudinary
    const cloudinaryFolderOption = {
      folder: "user Profile",
      crop: "scale",
    };

    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );
    let user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      middlename: req.body.middlename,
      phone: req.body.phone,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      role: "admin",
      avatar: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    });

    user = await user.save();

    if (!user) return res.status(500).send("The student cannot be created");

    res.send(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during student creation");
  }
});

router.post(`/guidance`, uploadOptions.single("avatar"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("no image in the request");

    // Upload category images to Cloudinary
    const cloudinaryFolderOption = {
      folder: "User Profile",
      crop: "scale",
    };

    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );

    let user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      middlename: req.body.middlename,
      phone: req.body.phone,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      avatar: {
        public_id: result.public_id,
        url: result.secure_url,
      },
      role: "guidance",
    });

    user = await user.save();

    if (!user) return res.status(400).send("the user cannot be created!");

    res.send(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during student creation");
  }
});

router.post("/adviser", uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("no image in the request");

    // Upload category images to Cloudinary
    const cloudinaryFolderOption = {
      folder: "User Profile",
      crop: "scale",
    };

    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );

    let user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      middlename: req.body.middlename,
      phone: req.body.phone,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      role: "adviser",
      avatar: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    });

    user = await user.save();

    if (!user) return res.status(500).send("The student cannot be created");

    res.send(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during student creation");
  }
});

router.post("/cashier", uploadOptions.single("avatar"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("no avatar in the request");

    // Upload category images to Cloudinary
    const cloudinaryFolderOption = {
      folder: "User Profile",

      crop: "scale",
    };

    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );

    let user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      middlename: req.body.middlename,
      phone: req.body.phone,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      role: "cashier",
      avatar: {
        public_id: result.public_id,
        url: result.secure_url,
      },
    });

    user = await user.save();

    if (!user) return res.status(500).send("The student cannot be created");

    res.send(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during student creation");
  }
});

router.post("/register", async (req, res) => {
  try {
    // Check if an image is provided, otherwise use the default image
    let avatar;
    if (!req.body.avatar) {
      // Define your default image URL or public_id here
      const defaultImageUrl =
        "https://res.cloudinary.com/dn638duad/image/upload/v1708276779/Student%20Profile/fghiuvjlxd5vbcnjxy2t.jpg";
      avatar = {
        url: defaultImageUrl,
      };
    } else {
      avatar = req.body.avatar; // Use the provided image
    }

    // Create new user with default profile image URL
    let user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      middlename: req.body.middlename,
      schoolId: req.body.schoolId,
      schoolYear: req.body.schoolYear,
      phone: req.body.phone,
      grade: req.body.grade,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      role: "alumni",
      avatar: avatar, // Assign the images object
    });

    user = await user.save();

    if (!user) {
      return res.status(400).send("The user cannot be created");
    }

    res.send(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during user registration");
  }
});

router.post(`/student`, uploadOptions.single("avatar"), async (req, res) => {
  try {
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).send("Email already exists");
    }

    const existingPhone = await User.findOne({ phone: req.body.phone });
    if (existingPhone) {
      return res.status(400).send("Phone number already exists");
    }

    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);

    let password = await bcrypt.hashSync(req.body.password, salt);

    const file = req.file;
    if (!file) return res.status(400).send("no image in the request");

    // Upload category images to Cloudinary
    const cloudinaryFolderOption = {
      folder: "User Profile",
      crop: "scale",
    };

    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );

    let user = new User({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      middlename: req.body.middlename,
      grade: req.body.grade,
      schoolYear: req.body.schoolYear,
      schoolId: req.body.schoolId,
      phone: req.body.phone,
      email: req.body.email,
      password: password,
      avatar: {
        public_id: result.public_id,
        url: result.secure_url,
      },
      role: "student",
    });

    user = await user.save();

    if (!user) return res.status(400).send("the user cannot be created!");

    res.send(user);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during student creation");
  }
});

// router.post("/register", async (req, res) => {
//   let user = new User({
//     firstname: req.body.firstname,
//     lastname: req.body.lastname,
//     middlename: req.body.middlename,
//     schoolId: req.body.schoolId,
//     schoolYear: req.body.schoolYear,
//     phone: req.body.phone,
//     grade: req.body.grade,
//     email: req.body.email,
//     passwordHash: bcrypt.hashSync(req.body.password, 10),
//     role: "alumni",
//   });

//   user = await user.save();

//   if (!user) return res.status(400).send("the user cannot be created!");

//   res.send(user);
// });

router.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  const secret = process.env.secret;
  if (!user) {
    return res.status(400).send("The user not found");
  }

  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },

      secret,
      { expiresIn: "1d" }
    );

    res.status(200).send({ user: user.email, token: token });
  } else {
    res.status(400).send("password is wrong!");
  }
});

router.delete("/:id", (req, res) => {
  User.findByIdAndRemove(req.params.id)
    .then((user) => {
      if (user) {
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

router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments((count) => count);

  if (!userCount) {
    res.status(500);
  }

  res.send({
    userCount: userCount,
  });
});

// working edit user information
router.put(
  "/userProfile/:id",
  uploadOptions.single("image"),
  async (req, res) => {
    try {
      const file = req.file;

      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send("Invalid User Id");
      }

      const userFind = await User.findById(req.params.id);
      if (!userFind) return res.status(400).send("Invalid User Profile!");
      console.log(userFind, "sjdadjasldas");

      let avatar;

      const cloudinaryFolderOption = {
        folder: "User Profile",
        crop: "scale",
      };

      if (file) {
        const result = await cloudinary.v2.uploader.upload(
          req.file.path,
          cloudinaryFolderOption
        );
        avatar = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      } else {
        avatar = userFind.avatar;
      }

      const updatedUser = {
        email: req.body.email || userFind.email,
        firstname: req.body.firstname || userFind.firstname,
        lastname: req.body.lastname || userFind.lastname,
        middlename: req.body.middlename || userFind.middlename,
        schoolId: req.body.schoolId || userFind.schoolId,
        schoolYear: req.body.schoolYear || userFind.schoolYear,
        phone: req.body.phone || userFind.phone,
        grade: req.body.grade || userFind.grade,
        avatar: avatar,
      };

      const updatedUserData = await User.findByIdAndUpdate(
        req.params.id,
        updatedUser,
        {
          new: true,
        }
      );

      if (!updatedUserData) {
        return res
          .status(400)
          .json({ success: false, message: "The user cannot be updated" });
      }

      res.status(200).json({ success: true, user: updatedUserData });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }
);

// router.put(
//   "/userProfile/:id",
//   uploadOptions.single("image"),
//   async (req, res) => {
//     try {
//       const file = req.file;

//       if (!mongoose.isValidObjectId(req.params.id)) {
//         return res.status(400).send("Invalid User Id");
//       }

//       const userFind = await User.findById(req.params.id);
//       if (!userFind) return res.status(400).send("Invalid User Profile!");
//       console.log(userFind, "sjdadjasldas");

//       let avatar;

//       const cloudinaryFolderOption = {
//         folder: "User Profile",
//         crop: "scale",
//       };

//       if (file) {
//         const result = await cloudinary.v2.uploader.upload(
//           req.file.path,
//           cloudinaryFolderOption
//         );
//         avatar = {
//           public_id: result.public_id,
//           url: result.secure_url,
//         };
//       } else {
//         avatar = userFind.avatar;
//       }

//       // Update user's profile information
//       const updatedUser = {
//         firstname: req.body.firstname || userFind.firstname,
//         lastname: req.body.lastname || userFind.lastname,
//         middlename: req.body.middlename || userFind.middlename,
//         schoolId: req.body.schoolId || userFind.schoolId,
//         schoolYear: req.body.schoolYear || userFind.schoolYear,
//         phone: req.body.phone || userFind.phone,
//         grade: req.body.grade || userFind.grade,
//         avatar: avatar,
//       };

//       // Check if the user wants to change password
//       if (req.body.currentPassword && req.body.newPassword) {
//         // Check if the current password provided by the user matches the stored password
//         const isPasswordValid = await bcrypt.compare(req.body.currentPassword, userFind.password);
//         if (!isPasswordValid) {
//           return res.status(400).send("Invalid current password");
//         }

//         // Hash the new password
//         const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);

//         // Update the user's password in the database
//         updatedUser.password = hashedPassword;
//       }

//       // Update the user's profile in the database
//       const updatedUserData = await User.findByIdAndUpdate(req.params.id, updatedUser, { new: true });

//       if (!updatedUserData) {
//         return res.status(400).json({ success: false, message: "The user cannot be updated" });
//       }

//       res.status(200).json({ success: true, user: updatedUserData });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ success: false, message: "Internal server error" });
//     }
//   }
// );

module.exports = router;
