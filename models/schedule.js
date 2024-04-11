const mongoose = require ('mongoose');


const scheduleSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    
    DateTime: {
        type: Date,
        required: true,
    },
   
});


scheduleSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

scheduleSchema.set('toJSON', {
    virtuals: true,
});

exports.Schedule  = mongoose.model('Schedule', scheduleSchema);
