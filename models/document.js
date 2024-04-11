const mongoose = require("mongoose");

const documentSchema = mongoose.Schema({
  
  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    default: 0,
  },

  image: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  codename: {
    type: String,
    unique: true,

},
});

documentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

documentSchema.set("toJSON", {
  virtuals: true,
});

exports.Document = mongoose.model("Document", documentSchema);
