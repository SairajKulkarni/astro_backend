const User = require("../models/userModel.cjs");
const Video = require("../models/videoModel.cjs");
const ErrorHandler = require("../utils/errorHandler.cjs");
const catchAsyncErrors = require("../middleware/catchAsyncErrors.cjs");
const sendToken = require("../utils/jwtToken.cjs");
const sendEmail = require("../utils/sendMail.cjs");
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;
const uriParser = require("../utils/dataUri.cjs");

// Register a user
exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: "this is a sample id",
      url: "profilePictureUrl",
    },
  });

  sendToken(user, 201, res);
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if the user has provided both (email and password)
  if (!email || !password) {
    return next(
      new ErrorHandler("Please enter the Email & Password both", 400)
    );
  }

  // in the user model we have made the selecion of password as false therefore we need to select the password filed diffferently as following
  const user = await User.findOne({ email }).select("+password");

  // if no user with the provided email if found the following condition
  if (!user) return next(new ErrorHandler("Invalid email or password", 401));

  const isPasswordMatched = await user.comparePassword(password);

  // if user with given email id is found but the password provided is wrong
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // if the password matches the return the token
  sendToken(user, 200, res);
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    message: "Logged out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Get reset password token (OTP)
  const otp = await user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const message = `Your OTP for password reset is: ${otp}. Use this OTP to reset your password. If you have not requested this email then please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Password Recovery`,
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { otp, password, confirmPassword } = req.body;

  // Find the user with the provided OTP and a valid expiry time
  const user = await User.findOne({
    resetPasswordToken: otp,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Invalid OTP or OTP expired", 400));
  }

  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Set the new password
  user.password = password;

  // Clear reset password fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  // Save the user
  await user.save();

  // Send token for user login or other actions
  sendToken(user, 200, res);
});

// Get User Details
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

// Update User Password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 401));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords don't match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// Udapte User Profile
exports.updateUserProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };

  // We have not added cloud for the avatar update so we will do it later

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "User details updated successfully",
    user,
  });
});

// Get all users -- ADMIN
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    success: true,
    users,
  });
});

// Get Single User Details -- ADMIN
exports.getAnyUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with id  ${req.body.params}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Udapte User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.user.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    user,
  });
});

// Delete User -- ADMIN
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler(`User does not exist with the id: ${req.params.id}`)
    );
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// Video Controllers
exports.uploadVideo = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log(req.body);
    const { title, description } = req.body;
    const file = req.file;
    console.log(file);
    if (!title || !description || !file) {
      throw new ErrorHandler(
        "Please provide both title, description, and video file.",
        400
      );
    }

    const fileUri = uriParser.getDataUri(file);
    console.log("File URI:", fileUri); // Log the file URI

    const myCloud = await cloudinary.uploader.upload(fileUri.content, {
      resource_type: "video", // Specify the resource type as video
    });
    console.log("Cloudinary Upload Result:", myCloud); // Log Cloudinary upload result

    const newVideo = await Video.create({
      title,
      description,
      video: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
      tutor: req.user._id,
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { videos: newVideo._id },
    });
    console.log("New Video:", newVideo); // Log the new video entry

    res.status(201).json({
      success: true,
      message: "Video uploaded successfully",
      video: newVideo,
    });
  } catch (error) {
    console.error("Error during video upload:", error);
    next(new ErrorHandler(error.message, error.statusCode || 500));
  }
});

// Get All Videos
exports.getAllVideos = catchAsyncErrors(async (req, res, next) => {
  const videos = await Video.find().populate("tutor", "name email"); // Populate tutor details
  res.status(200).json({
    success: true,
    videos,
  });
});

exports.getUserVideos = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;

  // Populate the 'videos' field to get details of each video
  const userWithVideos = await User.findById(userId).populate("videos");

  res.status(200).json({
    success: true,
    videos: userWithVideos.videos,
  });
});

// Get Single Video Details
exports.getVideoDetails = catchAsyncErrors(async (req, res, next) => {
  const video = await Video.findById(req.params.id).populate(
    "tutor",
    "name email"
  ); // Populate tutor details

  if (!video) {
    return next(
      new ErrorHandler(`Video not found with id ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    video,
  });
});

// Update Video Details
exports.updateVideoDetails = catchAsyncErrors(async (req, res, next) => {
  const { title, description } = req.body;

  const video = await Video.findByIdAndUpdate(
    req.params.id,
    { title, description },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    message: "Video details updated successfully",
    video,
  });
});

// Delete Video
exports.deleteVideo = catchAsyncErrors(async (req, res, next) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    return next(new ErrorHandler(`Video not found with id: ${req.params.id}`));
  }

  await video.deleteOne();

  res.status(200).json({
    success: true,
    message: "Video deleted successfully",
  });
});
