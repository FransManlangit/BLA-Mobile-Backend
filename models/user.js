const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
  },
  lastname: {
    type: String,
  },
  middlename: {
    type: String,
  },
  phone: {
    type: String,
  },
  schoolId: {
    type: String,
  },
  grade: {
    type: String,
  },
  schoolYear: {
    type: String,
  },
  email: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    default: "User",
    // enum: ['Student', 'Teacher', 'Registrar', 'Cashier'],
  },

  avatar: {
    public_id: {
      type: String,
    },
    url: {
      type: String,
    },
  },

  resettoken: {
    type: String,
  },
  resettokenExpiration: {
    type: Date,
  },
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", {
  virtual: true,
});

exports.User = mongoose.model("User", userSchema);

exports.userSchema = userSchema;
