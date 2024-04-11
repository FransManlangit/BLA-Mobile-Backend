const mongoose = require('mongoose');

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
        default: 0.0
    },
   
    createdAt: {
        type: Date,
        default: Date.now,
    },


});

balanceSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

balanceSchema.set('toJSON', {
    virtuals: true,
});

exports.Balance = mongoose.model("Balance", balanceSchema);