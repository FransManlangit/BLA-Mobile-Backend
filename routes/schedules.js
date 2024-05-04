const express = require("express");
const { Schedule } = require("../models/schedule");
const { Request } = require("../models/request");
const { Order } = require("../models/order");
const { User } = require("../models/user");
const router = express.Router();
const mongoose = require("mongoose");

// Scheduling the release of student document
router.post("/", async (req, res) => {
  const { user, DateTime, requestId } = req.body; // Include requestId in request body

  try {
    // Check if the user exists
    const userExists = await User.findById(user);
    if (!userExists) {
      return res.status(400).json({ error: "User not found" });
    }

    // Check if the request exists and its status is "Approved"
    const request = await Request.findOne({ _id: requestId, requestStatus: "Approved" });
    if (!request) {
      return res.status(400).json({ error: "Request not found or not approved" });
    }

    const schedule = new Schedule({
      DateTime,
      user,
      request: requestId, // Assign the requestId to the schedule
      dateCreated: new Date(),
    });

    const savedSchedule = await schedule.save();
    res.status(201).json(savedSchedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// Schedule for the claiming of order
router.post("/orderSchedule", async (req, res) => {
  const { user, DateTime, orderId } = req.body;
  

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

    const schedule = new Schedule({
      DateTime,
      user,
      order: orderId, // Assigning the orderId to the schedule
      dateCreated: new Date(),
    });

    const savedSchedule = await schedule.save();
    res.status(201).json(savedSchedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// router.post("/orderSchdule", async (req, res) => {
//   const { user, DateTime } = req.body;

//   try {
//     // Check if the user exists
//     const userExists = await User.findById(user);
//     if (!userExists) {
//       return res.status(400).json({ error: "User not found" });
//     }

//     const schedule = new Schedule({
//       DateTime,
//       user,
//       dateCreated: new Date(),
//     });

//     const savedSchedule = await schedule.save();
//     res.status(201).json(savedSchedule);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

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

    console.log("List of Request", formattedUserRequests);

    res.status(200).json(formattedUserRequests);
  } catch (error) {
    console.error("Error fetching user requests:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// fetch student's orders
router.get(`/get/userOrders/:userid`, async (req, res) => {
  try {
    const userId = req.params.userid;

    // Fetch user requests with populated documents
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
      orderItems: order.ordrItems.map((orderItem) => ({
        productId: orderItem.product._id,
        productName: orderItem.product.productName,
        productPrice: orderItem.product.price,
        productImage: orderItem.product.images,
        paymentInfo: req.order.paymentInfo,
        quantity: orderItem.quantity,
      })),
    }));

    console.log("List of Request", formattedUserOrders);

    res.status(200).json(formattedUserOrders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/userSchedule/:id", async (req, res) => {
  try {
    const requestId = req.params.id;

    // Find the schedule that matches the request ID
    const schedule = await Schedule.findOne({ request: requestId }).populate('request');

    // If schedule not found, return error
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found for the request ID" });
    }

    // Retrieve the DateTime from the schedule
    const dateTime = schedule.DateTime;

    // If request exists, return the DateTime
    res.status(200).json({ dateTime });
  } catch (error) {
    console.error("Error fetching user schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// router.get("/userSchedule/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const userSchedule = await Schedule.find({ user: userId }).populate({
//       path: "user",
//     });

//     console.log(userSchedule, "fransssssss");
//     res.status(200).json(userSchedule);
//   } catch (error) {
//     console.error("Error fetching user schedule:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// fetching orders Schedule by id

router.get("/userOrderSchedule/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    
    const schedule = await Schedule.findOne({ order: orderId }).populate('order');

    // If schedule not found, return error
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found for the order ID" });
    }

    // Retrieve the DateTime from the schedule
    const dateTime = schedule.DateTime;

    // If order exists, return the DateTime
    res.status(200).json({ dateTime });
  } catch (error) {
    console.error("Error fetching user schedule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// router.get("/userOrderSchedule/:id", async (req, res) => {
//   try {
//     const userId = req.params.id;

//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     const userSchedule = await Schedule.find({ user: userId }).populate({
//       path: "user",
//     });

//     res.status(200).json(userSchedule);
//   } catch (error) {
//     console.error("Error fetching user schedule:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

// Get all schedules
router.get("/", async (req, res) => {
  try {
    const schedules = await Schedule.find().populate("user");
    res.status(200).json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific student and their schedule
router.get("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Schedule Id");
  }

  try {
    const schedule = await Schedule.findById(req.params.id).populate("user");
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.status(200).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the schedule date
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Schedule Id");
    }

    // Find the schedule by ID
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).send("Schedule not found");
    }

    schedule.DateTime = req.body.DateTime;

    await schedule.save();

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
