const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  orderItems: [
    {
      productName: {
        type: String,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
      },

      price: {
        type: Number,
        required: true,
      },

      image: {
        type: String,
      },

      product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Product",
      },
    },
  ],

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  orderStatus: {
    type: String,
    required: true,
    default: "Pending",
  },

  paymentInfo: {
    type: String,
    required: true,
  },

  paidAt: {
    type: Date,
    default: Date.now,
  },

  totalPrice: {
    type: Number,
  },

  dateOrdered: {
    type: Date,
    default: Date.now,
  },

  screenShot: {
    public_id: {
      type: String,
    },

    url: {
      type: String,
    },
  },

  gcashAmount: {
    type: Number,
  },

  gcashAccNumber: {
    type: Number,
  },

  gcashAccName: {
    type: String,
  },

  referenceNumber: {
    type: String,
  },

  HasPaid: {
    type: Boolean,
    default: false,
  },
});

orderSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

orderSchema.set("toJSON", {
  virtuals: true,
});

exports.Order = mongoose.model("Order", orderSchema);
