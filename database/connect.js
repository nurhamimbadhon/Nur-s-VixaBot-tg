const mongoose = require("mongoose");
const config = require("../config.json");

module.exports = async function connectDB() {
  const mongoUrl = process.env.MONGO_URI || config.mongoUrl;

  try {
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};
