import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from "./database/connect.js";
import eventHandler from "./handler/event.js";
import actionHandler from "./handler/action.js";
import commandLoader from "./utils/commandLoader.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load config
let configJson = {};
try {
  const configData = fs.readFileSync(path.join(__dirname, "config.json"), "utf8");
  configJson = JSON.parse(configData);
  console.log("✅ config.json loaded successfully");
} catch (error) {
  console.error("❌ config.json not found or invalid:", error.message);
  process.exit(1);
}

const SESSION_PATH = path.join(__dirname, "session", "main.session");

async function startBot() {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ Database connected!");

    // Check if session file exists
    if (!fs.existsSync(SESSION_PATH)) {
      console.error("❌ session/main.session not found! Run generate_session.py first");
      process.exit(1);
    }

    // Read session string
    const sessionString = fs.readFileSync(SESSION_PATH, "utf8").trim();
    
    // Validate required credentials
    const apiId = Number(configJson.apiId);
    const apiHash = configJson.apiHash;
    
    if (!apiId || !apiHash) {
      console.error("❌ Missing apiId or apiHash in config.json");
      console.error("Please make sure config.json contains:");
      console.error(`{
  "apiId": "your_api_id",
  "apiHash": "your_api_hash",
  "mongodbUri": "mongodb://localhost:27017/vixa_userbot",
  "botPrefix": ".",
  "ownerId": "your_telegram_user_id"
}`);
      process.exit(1);
    }

    // Create Telegram client
    const client = new TelegramClient(
      new StringSession(sessionString),
      apiId,
      apiHash,
      {
        connectionRetries: 5,
        useWSS: false,
        timeout: 30000
      }
    );

    // Connect to Telegram
    console.log("🔄 Connecting to Telegram...");
    await client.connect();
    console.log("✅ Userbot connected!");

    // Load commands
    console.log("🔄 Loading commands...");
    const commands = await commandLoader();
    console.log(`✅ Loaded ${Object.keys(commands).length} commands`);

    // Event handler for messages
    client.addEventHandler(async (update) => {
      try {
        if (update.message) {
          await eventHandler({
            message: update.message,
            chatId: update.chatId,
            isGroup: update.isGroup,
            senderId: update.senderId
          }, client, commands);
        }
      } catch (error) {
        console.error("❌ Error in message event handler:", error);
      }
    });

    // Event handler for reactions
    client.addEventHandler(async (update) => {
      try {
        if (update.reaction) {
          await actionHandler({
            reaction: update.reaction,
            message: update.message,
            senderId: update.senderId,
            client
          });
        }
      } catch (error) {
        console.error("❌ Error in reaction event handler:", error);
      }
    });

    console.log("🚀 Bot is ready and listening for events!");

    // Keep the bot running
    process.on('SIGINT', async () => {
      console.log("\n🔄 Shutting down bot...");
      await client.disconnect();
      console.log("✅ Bot disconnected safely");
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ Error starting bot:", error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start the bot
startBot();
