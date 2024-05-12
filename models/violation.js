const mongoose = require("mongoose");

const violationHistorySchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
    },
    violationInfo: {
      type: String,
    },
    status: {
      type: String,
    },
    recordBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const violationSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  lastname: {
    type: String,
  },

  grade: {
    type: String,
  },

  type: {
    type: String,
  },

  date: {
    type: Date,
    required: true,
  },

  description: {
    type: String,
  },

  status: {
    type: String,
    default: "With Violation",
  },

  violationLogs: [violationHistorySchema],
});

violationSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

violationSchema.set("toJSON", {
  virtuals: true,
});

exports.Violation = mongoose.model("Violation", violationSchema);
