const { Request } = require("../models/request");
const { Document } = require("../models/document");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const { PaymongoToken } = require("../models/paymongoTokenGenerate");
const crypto = require("crypto");
const axios = require("axios");
const mongoose = require("mongoose");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ms.jonara@gmail.com",
    pass: "hjwdqipeaaulcppw",
  },
});

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

// Sending email to Admin if the when the users request
const sendEmail = async (senderMail, requestDetails) => {
  try {
    // Send email
    const user = await User.findById(requestDetails.user);
    // const document = await Document.findById(requestDetails.request.document);

    requestDetails.userFirstName = user.firstname;
    requestDetails.userLastName = user.lastname;
    requestDetails.userGrade = user.grade;
    requestDetails.userEmail = user.email;
    // requestDetails.documents = document.name;

    // Format the date of request
    const dateOfRequest = new Date(requestDetails.dateofRequest);
    const formattedDateOfRequest = `${dateOfRequest.getFullYear()}-${
      dateOfRequest.getMonth() + 1
    }-${dateOfRequest.getDate()}`;

    // Format the paidAt date
    const paidAtDate = new Date(requestDetails.paidAt);
    const formattedPaidAtDate = `${paidAtDate.getFullYear()}-${
      paidAtDate.getMonth() + 1
    }-${paidAtDate.getDate()}`;

    await transporter.sendMail({
      from: "mcheaven4lyf@gmail.com",
      to: "fransmanlangit4@gmail.com, fransadryhelm@gmail.com, ms.jonara@gmail.com",
      subject: "Request Details",
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Appointment Details</title>
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
          #project {
            margin-bottom: 20px;
          }
          #project span {
            font-weight: bold;
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
            <h1>Request Details</h1>
          </header>
          <div id="project">
            <div><span>Student Name:</span> ${requestDetails.userFirstName} ${requestDetails.userLastName}</div>
            <div><span>Student Grade & Section:</span> ${requestDetails.userGrade}</div>
            <div><span>Purpose:</span> ${requestDetails.purpose}</div>
            <div><span>Date of Request:</span> ${formattedDateOfRequest}</div>
            <div><span>Date of Payment:</span> ${formattedPaidAtDate}</div>
         
            <div><span>Request Status:</span> ${requestDetails.requestStatus}</div>
            <div><span>Student Email:</span> ${requestDetails.userEmail}</div>
            <div><span>Payment Info:</span> ${requestDetails.paymentInfo}</div>
            <div><span>Total Price:</span> ${requestDetails.totalPrice}</div>
          </div>
          <footer>
            Appointment details were sent from a computer and are valid without signature and seal.
          </footer>
        </div>
      </body>
      </html>
    `,
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// fetching the users request with their specific details
router.get("/:id", async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate("user", "email", "lastname")
    .populate({
      path: "requestItems",
      populate: {
        path: "document",
        populate: "name",
      },
    });

  if (!request) {
    res.status(500).json({ success: false });
  }
  res.send(request);
});



// router.post("/", uploadOptions.any(), async (req, res) => {
//   try {
//     // Check if files exist in the request
//     if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).send("No image in the request");
//     }

//     // Filter authorization image from files
//     const authorizationImage = req.files.filter(
//       (file) => file.fieldname === "authorizationImage"
//     );

//     let imageAuthorization = null;

//     // Upload authorization image to Cloudinary if it exists
//     if (authorizationImage.length > 0) {
//       const cloudinaryFolderOption = {
//         folder: "Authorization Letter",
//         crop: "scale",
//       };

//       const autImageResult = await cloudinary.v2.uploader.upload(
//         authorizationImage[0].path,
//         cloudinaryFolderOption
//       );

//       imageAuthorization = {
//         public_id: autImageResult.public_id,
//         url: autImageResult.secure_url,
//       };
//     }

//     // Extract request data from the request body
//     const {
//       requestItems,
//       user,
//       email,
//       purpose,
//       dateofRequest,
//       paidAt,
//       requestStatus,
//       paymentInfo,
//       totalPrice,
//     } = req.body;

//     // Create a new request object
//     const request = new Request({
//       requestItems: requestItems.map((item) => ({
//         name: item.name,
//         price: item.price,
//         document: item._id,
//         quantity: item.quantity,
//       })),
//       purpose,
//       dateofRequest,
//       paidAt,
//       requestStatus,
//       user,
//       paymentInfo,
//       totalPrice,
//       authorizationLetter: imageAuthorization,
//     });

//     // Save the request to the database
//     const savedRequest = await request.save();

//     // Generate Paymongo token and send email
//     const paymongoToken = await new PaymongoToken({
//       requestId: request._id,
//       token: crypto.randomBytes(32).toString("hex"),
//       verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
//     }).save();

//     await sendEmail(email, savedRequest, user, request);

//     // Handle Gcash payment if applicable
//     if (paymentInfo === "Gcash") {
//       const temporaryLink = `http://192.168.100.206:4000/api/v1/requests/paymong-gcash/${paymongoToken.token}/${request._id}`;
//       const checkoutUrl = await PaymongoPayment(requestItems, temporaryLink);
//       console.log(checkoutUrl, "checkout");
//       return res.json({ checkoutUrl });
//     }

//     // Send response back to the client
//     res.json(savedRequest);
//   } catch (error) {
//     console.error("Error creating request:", error);
//     res.status(500).send("Error creating request!");
//   }
// });


// Working Paymongo Api with gcash and upload for authorization letter
router.post("/", uploadOptions.any(), async (req, res) => {
  console.log("req body", req.body);
  try {
    const file = req.files;
    console.log("file", file);
    if (!file) return res.status(400).send("no image in the request");

    const authorizationImage = req.files.filter(
      (file) => file.fieldname === "authorizationImage"
    );
    // Upload image to Cloudinary
    const cloudinaryFolderOption = {
      folder: "Authorization Letter",
      crop: "scale",
    };

    console.log("Authorization", authorizationImage);

    let imageAuthorization = [];

    if (authorizationImage.length > 0) {
      const autImageResult = await cloudinary.v2.uploader.upload(
        authorizationImage[0].path,
        cloudinaryFolderOption
      );

      imageAuthorization = {
        public_id: autImageResult.public_id,
        url: autImageResult.secure_url,
      };
    }

    const requestItems = JSON.parse(req.body.requestItems); // Parse requestItems string to JSON array
    const user = req.body.user;
    const email = req.body.email;
    const purpose = req.body.purpose;
    const dateofRequest = req.body.dateOfRequest;
    const paidAt = req.body.paidAt;
    const requestStatus = req.body.requestStatus;
    const paymentInfo = req.body.paymentInfo;
    const totalPrice = req.body.totalPrice;

    console.log("request items", requestItems);

    const request = new Request({
      requestItems: requestItems.map((item) => ({
        name: item.name,
        price: item.price,
        document: item._id,
        quantity: item.quantity,
      })),
      purpose: purpose,
      dateofRequest: dateofRequest,
      paidAt: paidAt,
      requestStatus: requestStatus,
      user: user,
      paymentInfo: paymentInfo,
      totalPrice: totalPrice,
      authorizationLetter: imageAuthorization|| null,
    });

    const savedRequest = await request.save();

    const paymongoToken = await new PaymongoToken({
      requestId: request._id,
      token: crypto.randomBytes(32).toString("hex"),
      verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
    }).save();

    await sendEmail(email, savedRequest, user, request);

    if (paymentInfo === "Gcash") {
      const temporaryLink = `http://192.168.100.206:4000/api/v1/requests/paymong-gcash/${paymongoToken.token}/${request._id}`;

      const checkoutUrl = await PaymongoPayment(requestItems, temporaryLink);
      console.log(checkoutUrl, "checkout");
      return res.json({ checkoutUrl });
    }

    // Send response back to the client
    res.json(savedRequest);
  } catch (error) {
    console.error("Error creating request:", error);
    res.status(500).send("Error creating request!");
  }
});

// Paymongo Api
const PaymongoPayment = async (requestDetails, temporaryLink) => {
  try {
    const lineItems = requestDetails.map((requestItem) => ({
      currency: "PHP",
      amount: requestItem.price * requestItem.quantity * 100,
      description: requestItem.purpose,
      name: requestItem.name,
      quantity: requestItem.quantity,
    }));

    console.log("line Items", lineItems);

    const options = {
      method: "POST",
      url: "https://api.paymongo.com/v1/checkout_sessions",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        authorization:
          "Basic c2tfdGVzdF9zbUZoOGhzY0Q3QmRXMUJuZDJqMnZMeHY6cGtfdGVzdF9MSmpobXB1dmppWGdSMlhuU0VZYkczTDQ=",
      },
      data: {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            line_items: lineItems,
            payment_method_types: ["gcash"],
            description: "Payment Request",
            success_url: `${temporaryLink}`,
          },
        },
      },
    };

    console.log("Options", options);

    const response = await axios.request(options);

    console.log("Response", response);

    const checkoutUrl = response.data.data.attributes.checkout_url;

    return checkoutUrl;
  } catch (error) {
    console.error("Error creating Paymongo session:", error);
    throw error; // Re-throw the error to be caught by the calling function
  }
};

// Updating the HasPaid if the payment is successful
router.get("/paymong-gcash/:tokenId/:requestId", async (req, res) => {
  try {
    // Retrieve the request based on the requestId parameter
    const request = await Request.findById(req.params.requestId).populate({
      path: "requestItems",
      populate: {
        path: "request",
        model: "Request",
      },
    });

    // Check if the request exists
    if (!request) {
      // If the request doesn't exist, return a 400 status with an error message
      return res.status(400).send("Invalid Link");
    }

    // Update the HasPaid field to true
    request.HasPaid = true;

    // Save the updated request
    await request.save();

    // Send a success response
    res
      .status(200)
      .json({
        message: "Payment completed successfully, thank you for requesting",
      });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error updating payment status:", error);
    // Return an error response
    res.status(500).json({ error: "Error updating payment status" });
  }
});

// Fetch all request with the status of pending
router.get("/pendingStatus", async (req, res) => {
  try {
    // Fetch only requests with a pending status
    const pendingRequests = await Request.find({ requestStatus: "Pending" })
      .populate({
        path: "user",
        select: "firstname lastname email grade",
      })
      .populate({
        path: "requestItems.document",
        model: "Document",
      });

    // Log the pending requests array
    console.log(JSON.stringify(pendingRequests, null, 2));

    // Send the pending requests in the response
    res.status(200).json(pendingRequests);

    console.log("Pending Requests", pendingRequests);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetching the number of pending status
router.get("/pendingCount", async (req, res) => {
  try {
    // Fetch only requests with a pending status
    const pendingRequestsCount = await Request.find({
      requestStatus: "Pending",
    })
      .populate({
        path: "user",
        select: "firstname lastname email grade",
      })
      .populate({
        path: "requestItems.document",
        model: "Document",
      });

    // Log the pending requests array
    console.log(JSON.stringify(pendingRequestsCount, null, 2));

    // Send the pending requests in the response
    res.status(200).json(pendingRequestsCount);

    console.log("Pending Requests", pendingRequestsCount);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// geting the request of the users and their specific details
router.get("/", async (req, res) => {
  try {
    const requestItems = await Request.find()
      .populate({
        path: "user",
        select: "firstname lastname email grade role",
      })
      .populate({
        path: "requestItems.document",
        model: "Document",
      });

    console.log(JSON.stringify(requestItems, null, 2)); // Log the requestItems array

    res.status(200).json(requestItems);
  } catch (error) {
    console.error("Error fetching request items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get(`/get/userRequests/:userid`, async (req, res) => {
  try {
    const userId = req.params.userid;

    // Fetch user requests with populated documents
    const userRequestList = await Request.find({ user: userId })
      .populate({
        path: "requestItems",
        populate: {
          path: "document",
          model: "Document",
        },
      })
      .populate({
        path: "user",
      })
      .sort({ dateofRequest: -1 });

    if (!userRequestList) {
      return res.status(500).json({ success: false });
    }

    // Extract and send only the relevant information to the frontend
    const formattedUserRequests = userRequestList.map((request) => ({
      requestId: request._id,
      dateofRequest: request.dateofRequest,
      paidAt: request.paidAt,
      requestItems: request.requestItems.map((requestItem) => ({
        documentId: requestItem.document._id,
        documentName: requestItem.document.name,
        documentPrice: requestItem.document.price,
        documentImage: requestItem.document.image,
        paymentInfo: req.request.paymentInfo,
        quantity: requestItem.quantity,
      })),
    }));

    res.status(200).json(formattedUserRequests);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", (req, res) => {
  Request.findByIdAndRemove(req.params.id)
    .then(async (request) => {
      if (request) {
        await request.requestItems.map(async (requestItem) => {
          await RequestItem.findByIdAndRemove(requestItem);
        });
        return res
          .status(200)
          .json({ success: true, message: "the request is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "request not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Request.aggregate([
    { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
  ]);

  if (!totalSales) {
    return res.status(400).send("The Request sales cannot be generated");
  }

  res.send({ totalsales: totalSales.pop().totalsales });
});

router.get(`/get/count`, async (req, res) => {
  const requestCount = await Request.countDocuments((count) => count);

  if (!requestCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    requestCount: requestCount,
  });
});

router.get(`/get/userSchedule/:userid`, async (req, res) => {
  const userScheduleList = await Schedule.find({
    user: req.params.userid,
  })
    .populate({
      path: "userSchedule",
      populate: {
        path: "schedule",
      },
    })
    .sort({ DateTime: -1 });

  if (!userScheduleList) {
    res.status(500).json({ success: false });
  }
  res.send(userScheduleList);
});

router.get("/userSchedule/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);

    const user = await User.findById(userId);
    console.log(user, "user");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userSchedule = await Schedule.find({ user: userId })
      .populate({
        path: "user",
      })
      .populate({
        path: "userSchedule",
        populate: { path: "schedule", model: "Schedule" },
      });

    res.status(200).json(userSchedule);
  } catch (error) {
    console.error("Error fetching user schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/requestItems/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requestItems = await Request.find({ user: userId })
      .populate({
        path: "user",
      })
      .populate({
        path: "requestItems",
        populate: [
          { path: "document", model: "Document" },
          { path: "DateTime", model: "Schedule" }, // Populate the DateTime field from the Schedule model
        ],
      });

    res.status(200).json(requestItems);
  } catch (error) {
    console.error("Error fetching request items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// router.get("/requestItems/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;

//     console.log(userId);
//     const user = await User.findById(userId);
//     console.log(user, "user");
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const requestItems = await Request.find({ user: userId })
//       .populate({
//         path: "user",
//       })
//       .populate({
//         path: "requestItems",
//         populate: [
//           { path: "document", model: "Document" },
//           { path: "DateTime", model: "Schedule" }, // Populate the DateTime field from the Schedule model
//         ],
//       });
//     console.log(requestItems);
//     //   const requestItems = await RequestItem.find({ _id: { $in: request.requestItems } }).populate('document');

//     res.status(200).json(requestItems);
//   } catch (error) {
//     console.error("Error fetching request items:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

router.get("/requests/day", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const count = await Request.countDocuments({
      dateofRequest: { $gte: startOfDay, $lt: endOfDay },
    });

    console.log("Requests count per day:", count); // Added console.log

    res.json({ count });
  } catch (error) {
    console.error("Error counting requests per day:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/requests/month", async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const count = await Request.countDocuments({
      dateofRequest: { $gte: startOfMonth, $lte: endOfMonth },
    });

    console.log(count, "Requests"); // Added console.log

    res.json({ count });
  } catch (error) {
    console.error("Error counting requests per month:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/requests/year", async (req, res) => {
  try {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31);

    const count = await Request.countDocuments({
      dateofRequest: { $gte: startOfYear, $lte: endOfYear },
    });

    console.log("Requests count per year:", count); // Added console.log

    res.json({ count });
  } catch (error) {
    console.error("Error counting requests per year:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", async (req, res) => {
  const request = await Request.findByIdAndUpdate(
    req.params.id,
    {
      requestStatus: req.body.requestStatus,
    },
    { new: true }
  );

  if (!request) return res.status(400).send("the request cannot be update!");

  res.send(request);
});

// router.post("/", async (req, res) => {
//   try {
//     console.log("req body", req.body);

//     const requestItems = req.body.requestItems;
//     const user = req.body.user;
//     const email = req.body.email;
//     const purpose = req.body.purpose;
//     const dateofRequest = req.body.dateOfRequest;
//     const paidAt = req.body.paidAt;
//     const requestStatus = req.body.requestStatus;
//     const paymentInfo = req.body.paymentInfo;
//     const totalPrice = req.body.totalPrice;

//     // Validation checks
//     if (!user || !email || !dateofRequest || !purpose || !paidAt || !requestStatus || !paymentInfo || !totalPrice || !requestItems) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // Create new request
//     const request = new Request({
//       requestItems: requestItems.map((item) => ({
//         name: item.name,
//         price: item.price,
//         document: item._id,
//         quantity: item.quantity,
//       })),
//       purpose: purpose,
//       dateofRequest: dateofRequest,
//       paidAt: paidAt,
//       requestStatus: requestStatus,
//       user: user,
//       paymentInfo: paymentInfo,
//       totalPrice: totalPrice,
//     });

//     console.log("Request D", request)

//     const savedRequest = await request.save();

//     // Generate Paymongo token
//     const paymongoToken = await new PaymongoToken({
//       requestId: request._id,
//       token: crypto.randomBytes(32).toString("hex"),
//       verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
//     }).save();

//     // Send email notification
//     await sendEmail(email, savedRequest);

//     // Create checkout session and return checkout URL
//     if (paymentInfo === "Gcash") {
//       const temporaryLink = `http://192.168.100.206:4000/api/v1/requests/paymong-gcash/${paymongoToken.token}/${request._id}`;
//       const checkoutUrl = await PaymongoPayment(requestItems, temporaryLink);
//       console.log(checkoutUrl, "checkout");
//       return res.json({ checkoutUrl });
//     }

//     // Send response back to the client
//     res.json(savedRequest);
//   } catch (error) {
//     console.error("Error creating request:", error);
//     res.status(500).send("Error creating request!");
//   }
// });

// router.get("/paymong-gcash/:requestId", async (req, res) => {
//   try {
//     const requestId = req.params.requestId;
//     const paymentSuccessful = true; // Define paymentSuccessful variable

//     const request = await Request.findById(requestId);
//     if (!request) {
//       throw new Error("Request not found");
//     }

//     // Update the HasPaid field based on payment success
//     request.HasPaid = paymentSuccessful;

//     // Save the updated request
//     await request.save();

//     // Return success message
//     res
//       .status(200)
//       .send(`Payment status for request ${requestId} updated successfully.`);
//   } catch (error) {
//     console.error("Error updating payment status:", error);
//     res.status(500).json({ error: "Error updating payment status" });
//   }
// });

// router.post("/", uploadOptions.any(), async (req, res) => {
//   console.log("req body", req.body);
//   try {
//     const files = req.files;
//     console.log("files", files);
//     if (!files) return res.status(400).send("No image in the request");

//     const screenshotImage = files.filter(
//       (file) => file.fieldname === "screenshotImage"
//     );

//     const authorizationImage = files.filter(
//       (file) => file.fieldname === "authorizationImage"
//     );

//     // Upload images to Cloudinary
//     const cloudinaryFolderOption = {
//       folder: "Authorization Letter",
//       crop: "scale",
//     };

//     console.log("screenshotImage", screenshotImage);
//     console.log("authorizationImage", authorizationImage);

//     let imageScreenshot = {};
//     let imageAuthorization = {};

//     if (screenshotImage.length > 0) {
//       const screenshotResult = await cloudinary.v2.uploader.upload(
//         screenshotImage[0].path,
//         cloudinaryFolderOption
//       );

//       imageScreenshot = {
//         public_id: screenshotResult.public_id,
//         url: screenshotResult.secure_url,
//       };
//     }

//     if (authorizationImage.length > 0) {
//       const authorizationResult = await cloudinary.v2.uploader.upload(
//         authorizationImage[0].path,
//         cloudinaryFolderOption
//       );

//       imageAuthorization = {
//         public_id: authorizationResult.public_id,
//         url: authorizationResult.secure_url,
//       };
//     }

//     const requestItems = JSON.parse(req.body.requestItems);
//     const user = req.body.user;
//     const email = req.body.email;
//     const purpose = req.body.purpose;
//     const dateofRequest = req.body.dateOfRequest;
//     const paidAt = req.body.paidAt;
//     const requestStatus = req.body.requestStatus;
//     const paymentInfo = req.body.paymentInfo;
//     const totalPrice = req.body.totalPrice;
//     const gcashAccName = req.body.gcashAccName;
//     const gcashAccNumber = req.body.gcashAccNumber;
//     const gcashAmount = req.body.gcashAmount;
//     const referenceNumber = req.body.referenceNumber;

//     console.log("request items", requestItems);

//     const request = new Request({
//       requestItems: requestItems.map((item) => ({
//         name: item.name,
//         price: item.price,
//         document: item._id,
//         quantity: item.quantity,
//       })),
//       purpose: purpose,
//       dateofRequest: dateofRequest,
//       paidAt: paidAt,
//       requestStatus: requestStatus,
//       user: user,
//       paymentInfo: paymentInfo,
//       totalPrice: totalPrice,
//       referenceNumber: referenceNumber,
//       gcashAccName: gcashAccName,
//       gcashAccNumber: gcashAccNumber,
//       gcashAmount: gcashAmount,
//       authorizationLetter: imageAuthorization,
//       screenShot: imageScreenshot,
//     });

//     // Payment processing using Paymongo
//     const paymentIntent = await sdk.createPaymentIntent({
//       amount: totalPrice * 100, // Convert to cents
//       paymentMethod: 'gCash', // Example payment method, adjust as per your requirements
//       currency: 'PHP', // Example currency, adjust as per your requirements
//       description: 'Payment for request', // Example description
//     });

//     // Check the response of the payment processing
//     if (paymentIntent.status === 'succeeded') {
//       // Payment successful, proceed with saving the request and sending email
//       const savedRequest = await request.save();
//       await sendEmail(email, savedRequest);

//       res.send(savedRequest);
//     } else {
//       // Payment failed, handle the error
//       throw new Error("Payment failed");
//     }
//   } catch (error) {
//     console.error("Error creating request:", error);
//     res.status(500).send("Error creating request!");
//   }
// });

// router.get("/", async (req, res) => {
//   try {
//     const requestItems = await Request.find()
//       .populate({
//         path: "user",
//       })
//       .populate({
//         path: "request",
//         populate: { path: "document", model: "Document" },
//       });
//     console.log(requestItems, "WHERE IS THE DOCUMENT");

//     res.status(200).json(requestItems);
//   } catch (error) {
//     console.error("Error fetching request items:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// })

// router.get(`/`, async (req, res) => {
//   const requestList = await Request.find()
//     .populate("user", "email")
//     .sort({ dateofRequest: -1 });

//   if (!requestList) {
//     res.status(500).json({ success: false });
//   }

//   res.status(201).json(requestList);
// });

// Define a function to send the email

// router.get(`/:id`, async (req, res) => {
//   const request = await Request.findById(req.params.id)
//     .populate("user", "email")
//     .populate({
//       path: "requestItems",
//       populate: {
//         path: "document",
//       },
//     });

//   if (!request) {
//     res.status(500).json({ success: false });
//   }
//   res.send(request);
// });

//Working from chatgpt
// router.post(`/`, uploadOptions.single("image"), async (req, res) => {
//   console.log(req.file,"JHSHAHDASHDHAS")
//   const {
//     purpose,
//     dateofRequest,
//     paidAt,
//     requestStatus,
//     user,
//     paymentInfo,
//     totalPrice,
//     email,

//   } = req.body;
// console.log(req.body,"Dataaaaa")
//   if (
//     !purpose ||
//     !dateofRequest ||
//     !paidAt ||
//     !requestStatus ||
//     !user ||
//     !paymentInfo ||
//     !totalPrice ||
//     !email
//   ) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }
//   let authorizationLetter = [];
//  console.log(req.body.image, "image malaki")
//   try {

//     if (req.body.image) {
//       const cloudinaryFolderOption = {
//         folder: "Authorization Letter",
//         crop: "scale",
//       };

//       const result = await cloudinary.v2.uploader.upload(
//         req.body.image.uri,
//         cloudinaryFolderOption
//       );

//       authorizationLetter = {
//         public_id: result.public_id,
//         url: result.secure_url,
//       };
//       console.log(result, "Resultsss")
//     }

//     const requestItemsIds = await Promise.all(
//       req.body.requestItems.map(async (requestItem) => {
//         const document = await Document.findById(requestItem._id);
//         if (!document) {
//           console.error(
//             "Document not found for request item:",
//             requestItem._id
//           );
//           throw new Error("Document not found for request item");
//         }

//         let newRequestItem = new RequestItem({
//           numofcopies: requestItem.numofcopies,
//           document: requestItem._id,
//         });

//         newRequestItem = await newRequestItem.save();
//         return newRequestItem._id;
//       })

//     );

//     // Create the request with the resolved request items
//     const request = new Request({
//       requestItems: requestItemsIds,
//       purpose: req.body.purpose,
//       dateofRequest: req.body.dateofRequest,
//       paidAt: req.body.paidAt,
//       requestStatus: req.body.requestStatus,
//       user: req.body.user,
//       paymentInfo: req.body.paymentInfo,
//       totalPrice: req.body.totalPrice,
//       authorizationLetter: authorizationLetter, // Assign the authorization letter
//     });
//     console.log(request,"Request Submit")

//     // Save the request to the database
//     const SavedRequest = await request.save();
//     await sendEmail(email, SavedRequest);

//     if (!request) {
//       console.error("The Request cannot be created");
//       return res.status(500).send("The Request cannot be created");
//     }

//     res.send(request);
//   } catch (error) {
//     console.error("Error creating request:", error);
//     res.status(500).send("Error creating request!");
//   }
// });

//Working with email error image upload for authorizatio letter
// router.post(`/`, uploadOptions.single("image"), async (req, res) => {
//   try {
//     const {
//       purpose,
//       dateofRequest,
//       paidAt,
//       requestStatus,
//       user,
//       paymentInfo,
//       totalPrice,
//       email,
//     } = req.body;

//     if (
//       !purpose ||
//       !dateofRequest ||
//       !paidAt ||
//       !requestStatus ||
//       !user ||
//       !paymentInfo ||
//       !totalPrice ||
//       !email
//     ) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     let authorizationLetter = {};

//     if (req.file) {
//       const cloudinaryFolderOption = {
//         folder: "Authorization Letter",
//         crop: "scale",
//       };

//       const result = await cloudinary.v2.uploader.upload(
//         req.file.path,
//         cloudinaryFolderOption
//       );

//       authorizationLetter = {
//         public_id: result.public_id,
//         url: result.secure_url,
//       };
//     }

//       const requestItemsIds = await Promise.all(
//       req.body.requestItems.map(async (requestItem) => {
//         const document = await Document.findById(requestItem._id);
//         if (!document) {
//           console.error("Document not found for request item:", requestItem._id);
//           throw new Error("Document not found for request item");
//         }

//         let newRequestItem = new RequestItem({
//           numofcopies: requestItem.numofcopies,
//           document: requestItem._id,
//         });

//         newRequestItem = await newRequestItem.save();
//         return newRequestItem._id;
//       })
//     );

//     const request = new Request({
//       requestItems: requestItemsIds,
//       purpose: purpose,
//       dateofRequest: dateofRequest,
//       paidAt: paidAt,
//       requestStatus: requestStatus,
//       user: user,
//       paymentInfo: paymentInfo,
//       totalPrice: totalPrice,
//       authorizationLetter: authorizationLetter,
//     });

//     const savedRequest = await request.save();
//     await sendEmail(email, savedRequest);

//     res.send(savedRequest);
//   } catch (error) {
//     console.error("Error creating request:", error);
//     res.status(500).send("Error creating request!");
//   }
// });

module.exports = router;
