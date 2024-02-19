const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please enter the video title"],
  },
  description: {
    type: String,
    required: [true, "Please enter the video description"],
  },
  video: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    // You might need to store the video URL or path accordingly
  },
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
});

module.exports = mongoose.model("Video", videoSchema);
