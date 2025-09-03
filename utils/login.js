const fs = require("fs");
const path = require("path");
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const config = require("../config.json");

module.exports = async function login() {
  const sessionPath = path.join(__dirname, "../session/main.session");
  if (!fs.existsSync(sessionPath)) {
    throw new Error(
      "❌ session/main.session not found! Run generateSession.py to create it."
    );
  }


  const sessionString = fs.readFileSync(sessionPath, "utf8");

  const client = new TelegramClient(
    new StringSession(sessionString),
    Number(process.env.API_ID || config.apiId),
    process.env.API_HASH || config.apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();
  console.log("✅ Logged in via saved session");
  return client;
};
