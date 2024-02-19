const express = require("express");
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct, // Corrected method name
  getSingleProductDetails,
  createProductReview,
  getProductReviews,
  deleteReview, // Corrected method name
} = require("../controllers/productController");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.route("/products").get(isAuthenticatedUser, getAllProducts);

router
  .route("/admin/product/new")
  .post(isAuthenticatedUser, authorizeRoles("admin"), createProduct);

router
  .route("/admin/product/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateProduct)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteProduct); // Corrected method name

router.route("/product/:id").get(getSingleProductDetails);

router.route("/review").put(isAuthenticatedUser, createProductReview);

router
  .route("/reviews")
  .get(getProductReviews)
  .delete(isAuthenticatedUser, deleteReview); // Corrected method name

module.exports = router;
