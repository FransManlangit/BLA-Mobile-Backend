const { Order } = require("../models/order");
const express = require("express");
const { Product } = require("../models/product");
const { User } = require("../models/user");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary");
const nodemailer = require("nodemailer");
const axios = require("axios");
const crypto = require("crypto");
const { PaymongoToken } = require('../models/paymongoTokenGenerate');

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



// Codes for sending email about customers Orders
const sendEmail = async (senderMail, orderDetails) => {
  try {
    // Send email
    const user = await User.findById(orderDetails.user);
    // const document = await Document.findById(orderDetails.order.document);

    orderDetails.userFirstName = user.firstname;
    orderDetails.userLastName = user.lastname;
    orderDetails.userGrade = user.grade;
    orderDetails.userEmail = user.email;
    // orderDetails.documents = document.name;

    // Format the date of order
    const dateOrdered = new Date(orderDetails.dateOrdered);
    const formattedDateOforder = `${dateOrdered.getFullYear()}-${
      dateOrdered.getMonth() + 1
    }-${dateOrdered.getDate()}`;

    // Format the paidAt date
    const paidAtDate = new Date(orderDetails.paidAt);
    const formattedPaidAtDate = `${paidAtDate.getFullYear()}-${
      paidAtDate.getMonth() + 1
    }-${paidAtDate.getDate()}`;

    await transporter.sendMail({
      from: "mcheaven4lyf@gmail.com",
      to: "ms.jonara@gmail.com",
      subject: "Order Details",
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Order Details</title>
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
            <h1>order Details</h1>
          </header>
          <div id="project">
            <div><span>Student Name:</span> ${orderDetails.userFirstName} ${orderDetails.userLastName}</div>
            <div><span>Student Grade & Section:</span> ${orderDetails.userGrade}</div>
            <div><span>Date of order:</span> ${formattedDateOforder}</div>
            <div><span>Date of Payment:</span> ${formattedPaidAtDate}</div>
         
            <div><span>order Status:</span> ${orderDetails.orderStatus}</div>
            <div><span>Student Email:</span> ${orderDetails.userEmail}</div>
            <div><span>Payment Info:</span> ${orderDetails.paymentInfo}</div>
            <div><span>Total Price:</span> ${orderDetails.totalPrice}</div>
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



router.get("/userSchedule/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId);

    const orders = await Order.find({ user: userId }).select('orderStatus dateRelease'); // Select the necessary fields

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "Orders not found" });
    }
   
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching user schedules:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// fetching users with order and populate their specific details
router.get("/", async (req, res) => {
  try {
    const orderItems = await Order.find()
      .populate({
        path: "user",
        select: "firstname lastname email grade",
      })
      .populate({
        path: "orderItems.product",
        model: "Product",
      });

    console.log(JSON.stringify(orderItems, null, 2)); // Log the orderItems array

    res.status(200).json(orderItems);
  } catch (error) {
    console.error("Error fetching order items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/orderSchedule", async (req, res) => {
  const { user, dateRelease, orderId } = req.body;

  try {
    // Check if the user exists
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(400).json({ error: "User not found" });
    }

    // Check if the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({ error: "Order not found" });
    }

    // Check if the order status is "Approved"
    if (order.orderStatus !== "Approved") {
      return res.status(400).json({ error: "Order is not approved" });
    }

    // Update the dateRelease field
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { dateRelease },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(400).json({ error: "Failed to update order" });
    }

    console.log("Updated Order:", updatedOrder);
    return res.status(200).json(updatedOrder);
  } catch (err) {
    console.error("Error editing order:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
});





// fethcing Order Id
router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "email")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    });

  if (!order) {
    res.status(500).json({ success: false });
  }
  res.send(order);
});

// Updating status of the Order
router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      orderStatus: req.body.orderStatus,
    },
    { new: true }
  );

  if (!order) return res.status(400).send("the order cannot be update!");

  res.send(order);
});

// Deleting specific orders
router.delete("/:id", (req, res) => {
  Order.findByIdAndRemove(req.params.id)
    .then(async (order) => {
      if (order) {
        await order.orderItems.map(async (orderItem) => {
          await orderItems.findByIdAndRemove(orderItem);
        });
        return res
          .status(200)
          .json({ success: true, message: "the order is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "order not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
  ]);

  if (!totalSales) {
    return res.status(400).send("The order sales cannot be generated");
  }

  res.send({ totalsales: totalSales.pop().totalsales });
});

router.get(`/get/userorders/:userid`, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid })
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ dateOrdered: -1 });

  if (!userOrderList) {
    res.status(500).json({ success: false });
  }
  res.send(userOrderList);
});

// Paymongo Api using Gcash
const PaymongoPayment = async (orderDetails, temporaryLink) => {
  try {
    const lineItems = orderDetails.map((orderItem) => ({
      currency: "PHP",
      amount: orderItem.price * orderItem.quantity * 100,
      description: orderItem.productName,
      name: orderItem.productName,
      quantity: orderItem.quantity,
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
            description: "Payment Order",
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


// Handle POST orders to create a new order
router.post("/", async (req, res) => {
  try {
    // Log the order body for debugging purposes
    console.log("req body", req.body);

    // Extract data from the order body
    const orderItems = req.body.orderItems;
    const user = req.body.user;
    const email = req.body.email;
    const dateOrdered = req.body.dateOrdered;
    const paidAt = req.body.paidAt;
    const orderStatus = req.body.orderStatus;
    const paymentInfo = req.body.paymentInfo;
    const totalPrice = req.body.totalPrice;

    // Validation checks for required fields
    if (!user || !email || !dateOrdered || !paidAt || !orderStatus || !paymentInfo || !totalPrice || !orderItems) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate and process each order item
    for (const item of orderItems) {
      const product = await Product.findById(item._id);
      if (!product) {
        return res.status(404).json({ error: `Product with ID ${item._id} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
      }
      // Deduct the quantity of ordered items from product stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create a new order object
    const order = new Order({
      orderItems: orderItems.map((item) => ({
        productName: item.productName,
        price: item.price,
        product: item._id,
        quantity: item.quantity,
      })),
      dateOrdered: dateOrdered,
      paidAt: paidAt,
      orderStatus: orderStatus,
      user: user,
      paymentInfo: paymentInfo,
      totalPrice: totalPrice,
    });

    // Save the newly created order
    const savedOrder = await order.save();

    // Generate a random Paymongo token for payment verification
    const paymongoToken = await new PaymongoToken({
      orderId: order._id,
      token: crypto.randomBytes(32).toString("hex"),
      verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
    }).save();

    // Send email notification to the user
    await sendEmail(email, savedOrder);

    // Create a checkout session and obtain the checkout URL based on the payment method
    if (paymentInfo === "Gcash") {
      const temporaryLink = `https://bla-mobile-backend-xe24.onrender.com/api/v1/orders/paymong-gcash/${paymongoToken.token}/${order._id}`;
      const checkoutUrl = await PaymongoPayment(orderItems, temporaryLink);
      console.log(checkoutUrl, "checkout");
      return res.json({ checkoutUrl });
    }

    // If payment method is not Gcash, send the saved order details back to the client
    res.json(savedOrder);
  } catch (error) {
    // Handle any errors that occur during order creation
    console.error("Error creating order:", error);
    res.status(500).send("Error creating order!");
  }
});

// Chaging the status if the payment is successful
router.get("/paymong-gcash/:tokenId/:orderId", async (req, res) => {
  try {
    // Retrieve the order based on the orderId parameter
    const order = await Order.findById(req.params.orderId).populate({
      path: "orderItems",
      populate:{
        path: "order",
        model: "Order",
      }
    })

    // Check if the order exists
    if (!order) {
      // If the order doesn't exist, return a 400 status with an error message
      return res.status(400).send("Invalid Link");
    }

    // Update the HasPaid field to true
    order.HasPaid = true;

    // Save the updated order
    await order.save();

    // Send a success response
    res.status(200).json({ message: "Payment completed successfully, thank you for purchasing our products" });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error updating payment status:", error);
    // Return an error response
    res.status(500).json({ error: "Error updating payment status" });
  }
});


router.get(`/get/userOrders/:userid`, async (req, res) => {
  try {
    const userId = req.params.userid;

    // Fetch user orders with populated documents
    const userOrderList = await Order.find({ user: userId })
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          model: "Product",
        },
      })
      .populate({
        path: "user",
      })
      .sort({ dateOrdered: -1 });

    if (!userOrderList) {
      return res.status(500).json({ success: false });
    }

    // Extract and send only the relevant information to the frontend
    const formattedUserOrders = userOrderList.map((order) => ({
      orderId: order._id,
      dateOrdered: order.dateOrdered,
      paidAt: order.paidAt,
      orderItems: order.orderItems.map((orderItem) => ({
        documentId: orderItem.product._id,
        documentName: orderItem.product.name,
        documentPrice: orderItem.product.price,
        documentImage: orderItem.product.images,
        paymentInfo: req.order.paymentInfo,
        quantity: orderItem.quantity,
      })),
    }));

    res.status(200).json(formattedUserOrders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/orderItems/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    console.log(userId);
    const user = await User.findById(userId);
    console.log(user, "user");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orderItems = await Order.find({ user: userId })
      .populate({
        path: "user",
      })
      .populate({
        path: "orderItems",
        populate: { path: "product", model: "Product" },
      });
    console.log(orderItems);

    res.status(200).json(orderItems);
  } catch (error) {
    console.error("Error fetching order items:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// router.post("/", uploadOptions.any(), async (req, res) => {
//   console.log("req body", req.body);
//   try {
//     const file = req.files;
//     console.log("FILES", file)
//     if (!file) return res.status(400).send("no image in the order");

//     const screenshotImage = req.files.filter(
//       (file) => file.fieldname === "screenshotImage"
//     );

//     // Upload image to Cloudinary
//     const cloudinaryFolderOption = {
//       folder: "Proof of Payment",
//       crop: "scale",
//     };

//     let imageScreenshot = [];

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

//     let orderItems = req.body.orderItems;
//     // Check if orderItems is already an object or needs parsing
//     if (typeof orderItems === 'string') {
//       orderItems = JSON.parse(orderItems);
//     }

//     const user = req.body.user;
//     const email = req.body.email;
//     const dateOrdered = req.body.dateOrdered;
//     const paidAt = req.body.paidAt;
//     const orderStatus = req.body.orderStatus;
//     const paymentInfo = req.body.paymentInfo.paymentInfo;
//     const totalPrice = req.body.totalPrice;
//     const gcashAccName = req.body.paymentInfo.gcashAccName;
//     const gcashAccNumber = req.body.paymentInfo.gcashAccNumber;
//     const gcashAmount = req.body.paymentInfo.gcashAmount;
//     const referenceNumber = req.body.paymentInfo.referenceNumber;

//     for (const item of orderItems) {
//       const product = await Product.findById(item._id);
//       if (!product) {
//         return res
//           .status(404)
//           .json({ error: `Product with ID ${item._id} not found` });
//       }
//       if (product.stock < item.quantity) {
//         return res
//           .status(400)
//           .json({ error: `Insufficient stock for product: ${product.name}` });
//       }
//       product.stock -= item.quantity;
//       await product.save();
//     }

//     const order = new Order({
//       orderItems: orderItems.map((item) => ({
//         productName: item.productName,
//         price: item.price,
//         product: item._id,
//         quantity: item.quantity,
//       })),
//       dateOrdered: dateOrdered,
//       paidAt: paidAt,
//       orderStatus: orderStatus,
//       user: user,
//       paymentInfo: paymentInfo,
//       totalPrice: totalPrice,
//       referenceNumber: referenceNumber,
//       gcashAccName: gcashAccName,
//       gcashAccNumber: gcashAccNumber,
//       gcashAmount: gcashAmount,
//       screenShot: imageScreenshot,
//     });

//     const savedOrder = await order.save();

//     await sendEmail(email, savedOrder);

//     // Axios POST order to create checkout session
//     const options = {
//       method: 'POST',
//       url: 'https://api.paymongo.com/v1/checkout_sessions',
//       headers: {
//         accept: 'application/json',
//         'Content-Type': 'application/json',
//         authorization: 'Basic c2tfdGVzdF9zbUZoOGhzY0Q3QmRXMUJuZDJqMnZMeHY6cGtfdGVzdF9MSmpobXB1dmppWGdSMlhuU0VZYkczTDQ='
//       },
//       data: {
//         data: {
//           attributes: {
//             billing: {
//               name: user,

//               email: email,
//               paidAt: paidAt,
//               dateOrdered: dateOrdered,
//             },
//             send_email_receipt: true,
//             show_description: true,
//             show_line_items: true,
//             payment_method_types: paymentInfo,
//             line_items: orderItems.map(item => ({
//               currency: 'PHP',
//               amount: item.price * 100, // Convert price to cents
//               name: item.productName,
//               quantity: item.quantity,
//               product: item.id
//             })),
//             reference_number: referenceNumber,
//             description: 'Paymongo',
//             totalPrice: totalPrice
//           }
//         }
//       }
//     };

//     const response = await axios.order(options);

//     console.log(response.data);

//     // Send response back to the client
//     res.json(savedOrder);
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).send("Error creating order!");
//   }
// });




// router.get("/paymong-gcash/:orderId", async (req, res) => {
//   try {
//     const orderId = req.params.orderId;
//     const paymentSuccessful = true; // Define paymentSuccessful variable

//     const order = await Order.findById(orderId);
//     if (!order) {
//       throw new Error("Order not found");
//     }

//     // Update the HasPaid field based on payment success
//     order.HasPaid = paymentSuccessful;

//     // Save the updated order
//     await order.save();

//     // Return success message
//     res
//       .status(200)
//       .send(`Payment status for order ${orderId} updated successfully.`);
//   } catch (error) {
//     console.error("Error updating payment status:", error);
//     res.status(500).json({ error: "Error updating payment status" });
//   }
// });



// Working gcash screenShot payment
// router.post("/", uploadOptions.any(), async (req, res) => {
//   console.log("req body", req.body);
//   try {
//     const file = req.files;
//     console.log("FILES", file)
//     if (!file) return res.status(400).send("no image in the order");

//     const screenshotImage = req.files.filter(
//       (file) => file.fieldname === "screenshotImage"
//     );

//     // Upload image to Cloudinary
//     const cloudinaryFolderOption = {
//       folder: "Proof of Payment",
//       crop: "scale",
//     };

//     let imageScreenshot = [];

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

//     let orderItems = req.body.orderItems;
//     // Check if orderItems is already an object or needs parsing
//     if (typeof orderItems === 'string') {
//       orderItems = JSON.parse(orderItems);
//     }

//     const user = req.body.user;
//     const email = req.body.email;
//     const dateOrdered = req.body.dateOrdered;
//     const paidAt = req.body.paidAt;
//     const orderStatus = req.body.orderStatus;
//     const paymentInfo = req.body.paymentInfo.paymentInfo;
//     const totalPrice = req.body.totalPrice;
//     const gcashAccName = req.body.paymentInfo.gcashAccName;
//     const gcashAccNumber = req.body.paymentInfo.gcashAccNumber;
//     const gcashAmount = req.body.paymentInfo.gcashAmount;
//     const referenceNumber = req.body.paymentInfo.referenceNumber;

//     for (const item of orderItems) {
//       const product = await Product.findById(item._id);
//       if (!product) {
//         return res
//           .status(404)
//           .json({ error: `Product with ID ${item._id} not found` });
//       }
//       if (product.stock < item.quantity) {
//         return res
//           .status(400)
//           .json({ error: `Insufficient stock for product: ${product.name}` });
//       }
//       product.stock -= item.quantity;
//       await product.save();
//     }

//     // console.log("order items", orderItems);

//     console.log("REQ BODY", req.body);
//     const order = new Order({
//       orderItems: orderItems.map((item) => ({
//         productName: item.productName,
//         price: item.price,
//         product: item._id,
//         quantity: item.quantity,
//       })),

//       dateOrdered: dateOrdered,
//       paidAt: paidAt,
//       orderStatus: orderStatus,
//       user: user,
//       paymentInfo: paymentInfo,
//       totalPrice: totalPrice,
//       referenceNumber: referenceNumber,
//       gcashAccName: gcashAccName,
//       gcashAccNumber: gcashAccNumber,
//       gcashAmount: gcashAmount,
//       screenShot: imageScreenshot,
//     });

//     const savedOrder = await order.save();

//     await sendEmail(email, savedOrder);

//     if (!savedOrder) throw new Error("The order item cannot be created");

//     res.send(savedOrder);
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).send("Error creating order!");
//   }
// });

// router.post("/", uploadOptions.any(), async (req, res) => {
//   console.log("req body", req.body);
//   try {
//     const file = req.files;
//     console.log("file", file);
//     if (!file) return res.status(400).send("no image in the order");

//     const screenshotImage = req.files.filter(
//       (file) => file.fieldname === "screenshotImage"
//     );

//     // Upload image to Cloudinary
//     const cloudinaryFolderOption = {
//       folder: "ScreenShot proof of Payment",
//       crop: "scale",
//     };

//     console.log("screenshotImage", screenshotImage);
//     let imageScreenshot = [];

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

//     // Process orderItems and deduct stock
//     const orderItems = JSON.parse(req.body.orderItems);
//     const user = req.body.user;
//     const email = req.body.email;
//     const dateOrdered = req.body.dateOrdered;
//     const paidAt = req.body.paidAt;
//     const orderStatus = req.body.orderStatus;
//     const paymentInfo = req.body.paymentInfo;
//     const totalPrice = req.body.totalPrice;
//     const gcashAccName = req.body.gcashAccName;
//     const gcashAccNumber = req.body.gcashAccNumber;
//     const gcashAmount = req.body.gcashAmount;
//     const referenceNumber = req.body.referenceNumber;

//     console.log("orderItems", orderItems);

//     for (const item of orderItems) {
//       const product = await Product.findById(item._id);
//       if (!product) {
//         return res
//           .status(404)
//           .json({ error: `Product with ID ${item._id} not found` });
//       }
//       if (product.stock < item.quantity) {
//         return res
//           .status(400)
//           .json({ error: `Insufficient stock for product: ${product.name}` });
//       }
//       product.stock -= item.quantity;
//       await product.save();
//     }

//     // Create new Order instance
//     // const {
//     //   user,
//     //   email,
//     //   dateOrdered,
//     //   paidAt,
//     //   orderStatus,
//     //   paymentInfo,
//     //   totalPrice,
//     //   gcashAccName,
//     //   gcashAccNumber,
//     //   gcashAmount,
//     //   referenceNumber,
//     // } = req.body;

//     const order = new Order({
//       orderItems: orderItems.map((item) => ({
//         productName: item.productName,
//         price: item.price,
//         product: item._id,
//         quantity: item.quantity,
//       })),
//       dateOrdered: dateOrdered,
//       paidAt: paidAt,
//       orderStatus: orderStatus,
//       user: user,
//       paymentInfo: paymentInfo,
//       totalPrice: totalPrice,
//       referenceNumber: referenceNumber,
//       gcashAccName: gcashAccName,
//       gcashAccNumber:gcashAccNumber,
//       gcashAmount: gcashAmount,
//       screenShot: imageScreenshot,
//     });

//     console.log("Order", order);

//     const savedOrder = await order.save();

//     await sendEmail(email, savedOrder);

//     if (!savedOrder) throw new Error("The order item cannot be created");

//     res.send(savedOrder);
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).send("Error creating order!");
//   }
// });

// router.get(`/`, async (req, res) => {
//   const orderList = await Order.find()
//     .populate("user", "lastname")
//     .sort({ dateOrdered: -1 });

//   if (!orderList) {
//     res.status(500).json({ success: false });
//   }

//   res.status(201).json(orderList);
// });

// router.get("/", async (req, res) => {
//   try {
//     const orderItems = await Order.find()
//       .populate({
//         path: "user",
//       })
//       .populate({
//         path: "orderItems",
//         populate: { path: "product", model: "Product" },
//       });
//       console.log(orderItems, "JFHSDHSHDSHDHS")

//     res.status(200).json(orderItems);
//   } catch (error) {
//     console.error("Error fetching order items:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// router.post("/", async (req, res) => {
//   const orderItemsIds = Promise.all(
//     req.body.orderItems.map(async (orderItem) => {
//       console.log(req.body);

//       let newOrderItem = new OrderItem({
//         quantity: orderItem.quantity,
//         product: orderItem.product,
//       });

//       newOrderItem = await newOrderItem.save();

//       return newOrderItem._id;
//     })
//   );
//   console.log(orderItemsIds);
//   const orderItemsIdsResolved = await orderItemsIds;
//   console.log(orderItemsIds);

//   let order = new Order({
//     orderItems: orderItemsIdsResolved,
//     status: req.body.status,
//     totalPrice: totalPrice,
//     user: req.body.user,
//   });
//   order = await order.save();

//   if (!order) return res.status(400).send("the order cannot be created!");

//   res.send(order);
// });

// router.post(`/`, async (req, res) => {
//   try {
//     const orderItemsIds = await Promise.all(
//       req.body.orderItems.map(async (orderItem) => {
//         const product = await Product.findById(orderItem._id);
//         let newOrderItem = new OrderItem({
//           quantity: orderItem.quantity,
//           product: orderItem._id,
//         });

//         newOrderItem = await newOrderItem.save();
//         return newOrderItem._id;
//       })
//     );

//     let order = new Order({
//       orderItems: orderItemsIds,
//       dateOrdered: req.body.dateOrdered,
//       paidAt: req.body.paidAt,
//       orderStatus: req.body.orderStatus,
//       user: req.body.user,
//       paymentInfo: req.body.paymentInfo,
//       totalPrice: req.body.totalPrice,
//     });

//     // Check for GCash payment and require proof of payment
//     if (order.paymentInfo === 'GCash' && !req.file) {
//       return res.status(400).send('Proof of payment required for GCash transactions!');
//     }

//     if (req.file) {
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "orders", // Specify the folder in Cloudinary
//         crop: "scale",
//       });
//       order.image = {
//         public_id: result.public_id,
//         url: result.secure_url,
//       };
//     }

//     order = await order.save();

//     res.send(order);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Error creating orders!");
//   }
// });

//working stocks
// router.post(`/`, uploadOptions.single("image"), async (req, res) => {
//   try {
//     const {
//       order,
//       paymentInfo,
//       proofofPayment
//     } = req.body;

//     if (!order || !paymentInfo) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const {
//       dateOrdered,
//       email,
//       orderItems,
//       orderStatus,
//       paidAt,
//       totalPrice,
//       user
//     } = order;

//     // Add validation for required fields in the order object
//     if (
//       !dateOrdered ||
//       !email ||
//       !orderItems ||
//       !orderStatus ||
//       !paidAt ||
//       !totalPrice ||
//       !user
//     ) {
//       return res.status(400).json({ error: "Missing required fields in order object" });
//     }

//     // Handle file upload if proof of payment is provided
//     let proofofPaymentObj = {};
//     if (proofofPayment) {
//       // Process the file upload
//       // Add your logic for handling file upload here
//     }

//     // Process orderItems and deduct stock
//     for (const item of orderItems) {
//       const product = await Product.findById(item._id);
//       if (!product) {
//         return res.status(404).json({ error: `Product with ID ${item._id} not found` });
//       }
//       if (product.stock < item.quantity) {
//         return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
//       }
//       product.stock -= item.quantity;
//       await product.save();
//     }

//     // Create the Order document
//     const orderDocument = new Order({
//       orderItems: orderItems.map((item) => ({
//         productName: item.productName,
//         price: item.price,
//         product: item._id,
//         quantity: item.quantity,
//       })),
//       dateOrdered,
//       email,
//       orderStatus,
//       paidAt,
//       totalPrice,
//       user,
//       proofofPayment: proofofPaymentObj,
//       paymentInfo,
//     });

//     const savedOrder = await orderDocument.save();

//     // Send confirmation email
//     await sendEmail(email, savedOrder);

//     res.json(savedOrder);
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).send("Error creating order!");
//   }
// });

// router.post(`/`, uploadOptions.single("image"), async (req, res) => {

//   try {
//     const {
//       dateOrdered,
//       paidAt,
//       orderStatus,
//       user,
//       paymentInfo,
//       totalPrice,
//       email,
//       orderItems
//     } = req.body;

//     if (
//       !dateOrdered ||
//       !paidAt ||
//       !orderStatus ||
//       !user ||
//       !paymentInfo ||
//       !totalPrice ||
//       !email ||
//       !orderItems
//     ) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // Deduct stock for each ordered item
//     for (const item of orderItems) {
//       const product = await Product.findById(item._id);
//       if (!product) {
//         return res.status(404).json({ error: `Product with ID ${item._id} not found` });
//       }
//       if (product.stock < item.quantity) {
//         return res.status(400).json({ error: `Insufficient stock for product: ${product.name}` });
//       }
//       product.stock -= item.quantity;
//       await product.save();
//     }

//     // Upload proof of payment if provided
//     let proofofPayment = {};
//     if (req.file) {
//       const cloudinaryFolderOption = {
//         folder: "Proof of Payment",
//         crop: "scale",
//       };
//       const result = await cloudinary.v2.uploader.upload(
//         req.file.path,
//         cloudinaryFolderOption
//       );
//       proofofPayment = {
//         public_id: result.public_id,
//         url: result.secure_url,
//       };
//     }

//     const order = new Order({
//       orderItems: orderItems.map((item) => ({
//         productName: item.productName,
//         price: item.price,
//         product: item._id,
//         quantity: item.quantity,
//       })),
//       dateOrdered: dateOrdered,
//       paidAt: paidAt,
//       orderStatus: orderStatus,
//       user: user,
//       paymentInfo: paymentInfo,
//       totalPrice: totalPrice,
//       proofofPayment: proofofPayment,
//       referenceNumber: referenceNumber, // assuming referenceNumber is defined elsewhere
//     });

//     const savedOrder = await order.save();

//     // Send confirmation email
//     await sendEmail(email, savedOrder);

//     res.send(savedOrder);
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.status(500).send("Error creating order!");
//   }
// });

module.exports = router;
