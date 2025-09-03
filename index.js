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
    // Connect to database using mongoUrl from config
    if (configJson.mongoUrl) {
      await connectDB(configJson.mongoUrl);
      console.log("✅ Database connected!");
    } else {
      console.warn("⚠️ No mongoUrl found in config.json, skipping database connection");
    }

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
      process.exit(1);
    }

    // Log configuration status
    console.log(`🔧 Configuration loaded:`);
    console.log(`   - API ID: ${apiId}`);
    console.log(`   - Prefix: ${configJson.prefix}`);
    console.log(`   - Owner IDs: ${configJson.ownerIds?.join(', ')}`);
    console.log(`   - Admin IDs: ${configJson.adminIds?.join(', ')}`);
    console.log(`   - Self Listen: ${configJson.selfListen}`);
    console.log(`   - Admin Only: ${configJson.adminOnly}`);
    console.log(`   - Group Mode: ${configJson.groupMode}`);
    console.log(`   - Inbox Mode: ${configJson.inboxMode}`);

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
          // Pass config to event handler
          await eventHandler({
            message: update.message,
            chatId: update.chatId,
            isGroup: update.isGroup,
            senderId: update.senderId
          }, client, commands, configJson);
        }
      } catch (error) {
        console.error("❌ Error in message event handler:", error);
      }
    });

    // Event handler for reactions
    client.addEventHandler(async (update) => {
      try {
        if (update.reaction) {
          // Pass config to action handler
          await actionHandler({
            reaction: update.reaction,
            message: update.message,
            senderId: update.senderId,
            client
          }, configJson);
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
