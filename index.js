import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import fs from "fs";
import path from "path";
import connectDB from "./database/connect.js";
import eventHandler from "./handler/event.js";
import actionHandler from "./handler/action.js";
import commandLoader from "./utils/commandLoader.js";
import configJson from "./config.json" assert { type: "json" };

const SESSION_PATH = path.join("./session/main.session");

async function startBot() {
  await connectDB();

  if (!fs.existsSync(SESSION_PATH)) {
    console.error("❌ session/main.session not found! Run generate_session.py");
    process.exit(1);
  }

  const sessionString = fs.readFileSync(SESSION_PATH, "utf8");
  const client = new TelegramClient(
    new StringSession(sessionString),
    Number(process.env.API_ID || configJson.apiId),
    process.env.API_HASH || configJson.apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();
  console.log("✅ Userbot connected!");

  const commands = await commandLoader(); // make commandLoader async

  client.addEventHandler(async (update) => {
    if (update.message) {
      await eventHandler({ message: update.message, chatId: update.chatId, isGroup: update.isGroup, senderId: update.senderId }, client, commands);
    }
  });

  client.addEventHandler(async (update) => {
    if (update.reaction) {
      await actionHandler({ reaction: update.reaction, message: update.message, senderId: update.senderId, client });
    }
  });

  console.log("🚀 Bot is ready!");
}

startBot();
