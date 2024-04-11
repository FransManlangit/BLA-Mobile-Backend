const mongoose = require("mongoose");

const clearanceSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },

  clearanceImages: [
    {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
  ],

  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

clearanceSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

clearanceSchema.set("toJSON", {
  virtuals: true,
});

exports.Clearance = mongoose.model('Clearance', clearanceSchema);

exports.clearanceSchema = clearanceSchema;