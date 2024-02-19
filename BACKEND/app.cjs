const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("dotenv");

env.config({ path: "BACKEND/config/config.env" });

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: "*", // Allow requests from any origin
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 204,
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Route imports
const userRoute = require("./routes/userRoutes.cjs");
const imageRoute = require("./routes/imageUploadRoutes.cjs");
const errorMiddleware = require("./middleware/error.cjs");
const payment = require("./routes/paymentRoute.cjs");

app.use("/api/v1", userRoute);
app.use("/api/v1", imageRoute);
app.use("/api/v1", payment);

// Middleware for errors
app.use(errorMiddleware);

module.exports = app;
