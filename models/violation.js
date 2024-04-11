const mongoose = require('mongoose');


const violationSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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

})

violationSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

violationSchema.set('toJSON', {
    virtuals: true,
});


exports.Violation = mongoose.model("Violation", violationSchema);
