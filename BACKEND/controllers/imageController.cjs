const uriParser = require("../utils/dataUri.cjs");
const Image = require("../models/imageModel.cjs");
const ErrorHandler = require("../utils/errorHandler.cjs");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.cjs");
const cloudinary = require("cloudinary").v2;

exports.uploadImage = catchAsyncErrors(async (req, res, next) => {
  try {
    const category = req.body.category;
    const file = req.file;

    if (!category || !file) {
      throw new ErrorHandler(
        "Please provide both category and image file.",
        400
      );
    }

    const fileUri = uriParser.getDataUri(file);
    const myCloud = await cloudinary.uploader.upload(fileUri.content);

    const newImage = await Image.create({
      category: category,
      image: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      image: newImage,
    });
  } catch (error) {
    next(new ErrorHandler(error.message, error.statusCode || 500));
  }
});

// Get All Images
exports.getAllImages = catchAsyncErrors(async (req, res, next) => {
  const images = await Image.find();

  // Extract only the image URLs from the images array
  const imageUrls = images.map((image) => image.image.url);

  res.status(200).json({
    success: true,
    images: imageUrls,
  });
});

// Get Single Image Details
exports.getImageDetails = catchAsyncErrors(async (req, res, next) => {
  const image = await Image.findById(req.params.id);
  if (!image) {
    return next(
      new ErrorHandler(`Image not found with id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    image,
  });
});

// Update Image Category
exports.updateImageCategory = catchAsyncErrors(async (req, res, next) => {
  const newCategory = req.body.category;

  const image = await Image.findByIdAndUpdate(
    req.params.id,
    { category: newCategory },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    message: "Image category updated successfully",
    image,
  });
});

// Delete Image
exports.deleteImage = catchAsyncErrors(async (req, res, next) => {
  const image = await Image.findById(req.params.id);

  if (!image) {
    return next(new ErrorHandler(`Image not found with id: ${req.params.id}`));
  }

  await image.deleteOne();

  res.status(200).json({
    success: true,
    message: "Image deleted successfully",
  });
});
