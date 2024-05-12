const mongoose = require("mongoose");

const balanceHistorySchema = new mongoose.Schema(
  {
    studentName: {
      type:String
    },
    balanceInfo: {
      type: String,
    },
    status: {
      type: String,
    },   
    amountPaid: {
      type: Number,
      required: true,
    },
    recordBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const balanceSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },

  lastname: {
    type: String,
  },
  grade: {
    type: String,
  },

  specificBalance: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0.0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  status: {
    type: String,
    default:"Unsettled"
},

  balanceLogs: [balanceHistorySchema],
});

balanceSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

balanceSchema.set("toJSON", {
  virtuals: true,
});

exports.Balance = mongoose.model("Balance", balanceSchema);
