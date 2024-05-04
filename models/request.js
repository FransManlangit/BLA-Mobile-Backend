const mongoose = require("mongoose");

const requestSchema = mongoose.Schema({
  requestItems: [
    {
      name: {
        type: String,
        required: true,
      },

      price: {
        type: Number,
        required: true,
      },

      document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
        required: true,
      },

      image: {
        type: String,
      },

      quantity: {
        type: Number,
        required: true,
      },
    },
  ],

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  purpose: {
    type: String,
    required: true,
  },

  dateofRequest: {
    type: Date,
    default: Date.now,
  },

  paidAt: {
    type: Date,
    default: Date.now,
  },

  requestStatus: {
    type: String,
    default: "Pending",
  },

  dateRelease: {
    type: Date,
},

  paymentInfo: {
    type: String,
    required: true,
  },

  totalPrice: {
    type: Number,
  },

  authorizationLetter: {
    public_id: {
      type: String,
    },

    url: {
      type: String,
    },
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

requestSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

requestSchema.set("toJSON", {
  virtuals: true,
});

exports.Request = mongoose.model("Request", requestSchema);
