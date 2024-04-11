const express = require("express");
const { Document } = require("../models/document");
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

router.post(`/`, uploadOptions.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).send("no image in the request");

    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    // Upload category images to Cloudinary
    const cloudinaryFolderOption = {
      folder: "document",
      crop: "scale",
    };

    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );

    let document = new Document({
      name: req.body.name,
      description: req.body.description,
      image: {
        public_id: result.public_id,
        url: result.secure_url,
      },
      price: req.body.price,
      createdAt: req.body.createdAt
    });

    document = await document.save();

    if (!document)
      return res.status(500).send("The document cannot be created");

    res.send(document);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("An error occurred during document creation");
  }
});

router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  console.log(req.body);
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Document Id");
  }

  const document = await Document.findById(req.params.id);
  if (!document) return res.status(400).send("Invalid Document!");

  const file = req.file;
  let image;

  const cloudinaryFolderOption = {
    folder: "document",
    
    crop: "scale",
  };

  if (file) {
    const result = await cloudinary.v2.uploader.upload(
      req.file.path,
      cloudinaryFolderOption
    );
    image = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } else {
    image = document.image;
  }

  const updatedDocument = await Document.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      image: image,
      price: req.body.price,
  

   
    },
    { new: true }
  );

  if (!updatedDocument)
    return res.status(500).send("the Document cannot be updated!");

  res.send(updatedDocument);
});


router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Document Id");
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }

    const document = await Document.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!document)
      return res.status(500).send("the gallery cannot be updated!");

    res.send(document);
  }
);

router.get(`/`, async (req, res) => {
  console.log(req.query);
  const documentList = await Document.find();

  if (!documentList) {
    res.status(500).json({ success: false });
  }

  res.send(documentList);
});

router.delete("/:id", (req, res) => {
  console.log(req.body);
  Document.findByIdAndRemove(req.params.id)
    .then((document) => {
      if (document) {
        return res
          .status(200)
          .json({ success: true, message: "the document is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "document not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

module.exports = router;
