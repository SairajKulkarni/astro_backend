const ErrorHandler = require("../utils/errorHandler.cjs");
const catchAsyncErrors = require("./catchAsyncErrors.cjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel.cjs");

exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  let token;

  // Check if the token is present in cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Check if the token is present in the Authorization header
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }

  try {
    const decodeData = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decodeData.id);

    if (!req.user) {
      return next(new ErrorHandler("User not found", 401));
    }

    next();
  } catch (error) {
    console.log(error);
    return next(new ErrorHandler("Invalid token", 401));
  }
});
// To ensure that admin is acessing
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // here we will passing "admin" as the parameter to the function and then in the if condition we are checking req.user.role if it is not equal to admin the we tell them that their role is not authorized to access the specific resource
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role:  ${req.user.role}, is not allowed to access this resource`,
          403
        )
      );
    }

    next();
  };
};
