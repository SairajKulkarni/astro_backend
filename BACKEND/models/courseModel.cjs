// models/courseModel.js
const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Other course details
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
