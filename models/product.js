const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(

    {
        productName: {
            type: String,
        },

        quantity: {
            type: Number,

        },

        status: {
        type: String,

        },

        by: {
        type: String,   
        },
    },
        {
        timestamps: true,
        }
    
);


const productSchema = mongoose.Schema({

    productName: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    images: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },

    price: {
        type: Number,
        default: 0
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required:true
    },
    
    stock: {
        type: Number,
        required: true,
        min: 0,
        max: 255
    },
   
    codename: {
        type: String,
        unique: true,
    },

    stockHistory: [stockSchema],
    
   
    createdAt: {
      type: Date,
      default: Date.now,
    },

   


    // dateCreated: {
    //     type: Date,
    //     default: Date.now,
    // },
})



productSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

productSchema.set('toJSON', {
    virtuals: true,
});


exports.Product = mongoose.model('Product', productSchema);
