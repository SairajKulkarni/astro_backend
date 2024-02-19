const express = require("express");
const {
  processPayment,
  sendStripeApiKey,
} = require("../controllers/paymentController.cjs");
const router = express.Router();
const { isAuthenticatedUser } = require("../middleware/auth.cjs");

router.route("/payment/process").post(isAuthenticatedUser, processPayment);

router.route("/stripeapikey").get(isAuthenticatedUser, sendStripeApiKey);

module.exports = router;
