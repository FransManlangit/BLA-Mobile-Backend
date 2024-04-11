const mongoose = require("mongoose");

const paymongoTokenGenerateSchema = new mongoose.Schema({

  orderId: {
    type: mongoose.Schema.ObjectId,
    ref: "Order",
    
  },  
  requestId: {
    type: mongoose.Schema.ObjectId,
    ref: "Request",
   
  },

  token: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

paymongoTokenGenerateSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

paymongoTokenGenerateSchema.set("toJSON", {
  virtuals: true,
});

exports.paymongoTokenGenerateSchema = paymongoTokenGenerateSchema;

exports.PaymongoToken = mongoose.model(
  "PaymongoToken",
  paymongoTokenGenerateSchema
);


