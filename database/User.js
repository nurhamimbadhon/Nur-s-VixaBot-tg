const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  user_id: { type: String, index: true },
  isAdmin: { type: Boolean, default: false },
  isWhitelist: { type: Boolean, default: false }
});

module.exports = mongoose.model("User", UserSchema);
