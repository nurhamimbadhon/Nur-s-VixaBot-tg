const mongoose = require("mongoose");

const ConfigSchema = new mongoose.Schema({
  prefix: { type: String, default: "!" },
  selfListen: { type: Boolean, default: true },
  adminOnly: { type: Boolean, default: false },
  ownerOnly: { type: Boolean, default: false },
  groupMode: { type: Boolean, default: true },
  inboxMode: { type: Boolean, default: true },
  admins: { type: [String], default: [] },
  owners: { type: [String], default: [] },
  whitelist: { type: [String], default: [] }
});

module.exports = mongoose.model("Config", ConfigSchema);
