const express = require("express");
const { Product } = require("../models/product");
const { Category } = require("../models/category");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const cloudinary = require("cloudinary");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  console.log(req.query);
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }
  const productList = await Product.find(filter).populate("category");
  if (!productList) {
    res.status(500).json({ success: false });
  }
  res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category");

  if (!product) {
    res.status(500).json({ success: false });
  }
  res.send(product);
});


router.post(`/`, uploadOptions.single("images"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("No image in the order");

    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send("Invalid Category");

    // Upload product images to Cloudinary
    const cloudinaryFolderOption = {
      folder: "product",
      crop: "scale",
    };

    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );

     let product = new Product({
      productName: req.body.productName,
      description: req.body.description,
      images: {
        public_id: result.public_id,
        url: result.secure_url,
      },

      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,
      createdAt: req.body.createdAt
    });

    product = await product.save();

    if (!product)
      return res.status(500).send("The product cannot be created");

    res.send(product);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during product creation");
  }
});

router.put("/:id", uploadOptions.single("images"), async (req, res) => {
  console.log(req.body);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Product Id");
  }

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(400).send("Invalid Product!");

  const file = req.file;
  let images;

  const cloudinaryFolderOption = {
    folder: "product",
    crop: "scale",
  };

  if (file) {
    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );
    images = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } else {
    images = product.images;
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      productName: req.body.productName,
      description: req.body.description,
      images: images,
      price: req.body.price,
      category: req.body.category,
      stock: req.body.stock,

   
    },
    { new: true }
  );

  if (!updatedProduct)
    return res.status(500).send("the Product cannot be updated!");

  res.send(updatedProduct);
});

router.delete("/:id", (req, res) => {
  Product.findByIdAndRemove(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "the product is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "product not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

// router.put("/:id", uploadOptions.single("images"), async (req, res) => {
//   console.log(req.body);
//   if (!mongoose.isValidObjectId(req.params.id)) {
//     return res.status(400).send("Invalid Product Id");
//   }
//   const category = await Category.findById(req.body.category);
//   if (!category) return res.status(400).send("Invalid Category");

//   const product = await Product.findById(req.params.id);
//   if (!product) return res.status(400).send("Invalid Product!");

//   const file = req.file;
//   let images;

//   if (file) {
//     const result = await cloudinary.v2.uploader.upload(
//       req.file.path,
//       cloudinaryFolderOption
//     );
//     images = {
//       public_id: result.public_id,
//       url: result.secure_url,
//     };
//   } else {
//     images = product.images;
//   }


//   const cloudinaryFolderOption = {
//     folder: "product",
//     crop: "scale",
//   };

  
//   if (file) {
//     const result = await cloudinary.v2.uploader.upload(
//       req.file.path,
//       cloudinaryFolderOption
//     );
//     images = {
//       public_id: result.public_id,
//       url: result.secure_url,
//     };
//   } else {
//     images = product.images;
//   }


//   const updatedProduct = await Product.findByIdAndUpdate(
//     req.params.id,
//     {
//       productName: req.body.productName,
//       description: req.body.description,
//       images: images,
//       price: req.body.price,
//       category: req.body.category,
//       stock: req.body.stock,
    
//     },
//     { new: true }
//   );

//   if (!updatedProduct)
//     return res.status(500).send("the product cannot be updated!");

//   res.send(updatedProduct);
// });

module.exports = router;
