const express = require("express");
const userController = require("../controllers/userController.cjs");
const authMiddleware = require("../middleware/auth.cjs");
const router = express.Router();
const uploadMiddleware = require("../middleware/multer.cjs");

router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/password/forgot", userController.forgotPassword);
router.put("/password/reset", userController.resetPassword);
router.get("/logout", userController.logout);
router.get(
  "/me",
  authMiddleware.isAuthenticatedUser,
  userController.getUserDetails
);
router.put(
  "/password/update",
  authMiddleware.isAuthenticatedUser,
  userController.updatePassword
);
router.put(
  "/me/update",
  authMiddleware.isAuthenticatedUser,
  userController.updateUserProfile
);

// Admin Routes
router.get(
  "/admin/users",
  authMiddleware.isAuthenticatedUser,
  authMiddleware.authorizeRoles("admin"),
  userController.getAllUsers
);

router.post("/admin/login", userController.loginUser);

router.post("/tutor/login", userController.loginUser);
// Video Routes
router.post(
  "/video/upload",
  authMiddleware.isAuthenticatedUser,
  authMiddleware.authorizeRoles("tutor"),
  uploadMiddleware.singleUpload,
  userController.uploadVideo
);

router.get(
  "/user/videos",
  authMiddleware.isAuthenticatedUser,
  authMiddleware.authorizeRoles("tutor"),
  userController.getUserVideos
);

router.get("/videos", userController.getAllVideos);

router.get("/video/:id", userController.getVideoDetails);

router.put(
  "/video/update/:id",
  authMiddleware.isAuthenticatedUser,
  userController.updateVideoDetails
);

router.delete(
  "/video/delete/:id",
  authMiddleware.isAuthenticatedUser,
  userController.deleteVideo
);

// Uncomment and modify as needed
// router
//   .route("/admin/user/:id")
//   .get(authMiddleware.isAuthenticatedUser, authMiddleware.authorizeRoles("admin"), userController.getAnyUser)
//   .put(authMiddleware.isAuthenticatedUser, authMiddleware.authorizeRoles("admin"), userController.updateUserRole)
//   .delete(authMiddleware.isAuthenticatedUser, authMiddleware.authorizeRoles("admin"), userController.deleteUser);

module.exports = router;
