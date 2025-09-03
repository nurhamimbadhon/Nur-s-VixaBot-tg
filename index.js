// index.js
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

class TelegramUserBot {
    constructor() {
        this.client = null;
        this.commands = new Map();
        this.loadCommands();
    }

    // Load all commands from the commands directory
    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        if (!fs.existsSync(commandsPath)) {
            fs.mkdirSync(commandsPath, { recursive: true });
            console.log('📁 Commands directory created');
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            try {
                const commandPath = path.join(commandsPath, file);
                delete require.cache[require.resolve(commandPath)]; // Clear cache for hot reload
                const command = require(commandPath);
                
                if (command.name && command.execute) {
                    this.commands.set(command.name, command);
                    console.log(`✅ Loaded command: ${command.name}`);
                } else {
                    console.log(`⚠️  Command file ${file} is missing name or execute function`);
                }
            } catch (error) {
                console.error(`❌ Error loading command ${file}:`, error.message);
            }
        }
    }

    // Initialize the Telegram client
    async initialize() {
        try {
            // Read session file if exists
            const sessionPath = path.join(__dirname, 'session', 'main.session');
            let session = new StringSession('');
            
            if (fs.existsSync(sessionPath)) {
                const sessionData = fs.readFileSync(sessionPath, 'utf8');
                session = new StringSession(sessionData);
            }

            this.client = new TelegramClient(
                session,
                config.apiId,
                config.apiHash,
                {
                    connectionRetries: 5,
                }
            );

            console.log('🔄 Connecting to Telegram...');
            await this.client.start();
            
            // Save session data
            const sessionDir = path.join(__dirname, 'session');
            if (!fs.existsSync(sessionDir)) {
                fs.mkdirSync(sessionDir, { recursive: true });
            }
            fs.writeFileSync(sessionPath, this.client.session.save());

            const me = await this.client.getMe();
            console.log(`✅ Connected as: ${me.firstName} ${me.lastName || ''} (@${me.username || 'N/A'})`);
            
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('❌ Failed to initialize bot:', error.message);
            process.exit(1);
        }
    }

    // Setup event handlers for incoming messages
    setupEventHandlers() {
        this.client.addEventHandler(async (update) => {
            try {
                if (update.className === 'UpdateNewMessage') {
                    await this.handleMessage(update.message);
                }
            } catch (error) {
                console.error('❌ Error in event handler:', error.message);
            }
        });

        console.log('👂 Event handlers set up successfully');
    }

    // Handle incoming messages
    async handleMessage(message) {
        try {
            // Skip if message is empty or doesn't have text
            if (!message.message) return;

            const text = message.message;
            const isGroup = message.peerId.className === 'PeerChannel' || message.peerId.className === 'PeerChat';
            const isPrivate = message.peerId.className === 'PeerUser';

            // Get sender info
            const sender = await message.getSender();
            const senderId = sender.id.toString();

            // Check permissions
            if (!this.hasPermission(senderId, isGroup, isPrivate)) {
                return;
            }

            // Check if message starts with prefix
            if (!text.startsWith(config.prefix)) return;

            // Parse command and arguments
            const args = text.slice(config.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            // Check if command exists
            if (!this.commands.has(commandName)) return;

            const command = this.commands.get(commandName);

            // Execute command
            console.log(`🎯 Executing command: ${commandName} by ${sender.firstName || 'Unknown'} (${senderId})`);
            
            await command.execute({
                client: this.client,
                message: message,
                args: args,
                sender: sender,
                config: config,
                isGroup: isGroup,
                isPrivate: isPrivate
            });

        } catch (error) {
            console.error('❌ Error handling message:', error.message);
            try {
                await message.reply(`❌ Error: ${error.message}`);
            } catch (replyError) {
                console.error('❌ Failed to send error message:', replyError.message);
            }
        }
    }

    // Check if user has permission to use the bot
    hasPermission(userId, isGroup, isPrivate) {
        // Owner always has access
        if (config.ownerIds.includes(userId)) return true;

        // If owner only mode is enabled, only owners can use
        if (config.ownerOnly) return false;

        // Check admin permissions
        if (config.adminOnly && !config.adminIds.includes(userId)) return false;

        // Check whitelist if configured
        if (config.whitelistIds.length > 0 && !config.whitelistIds.includes(userId)) return false;

        // Check group/inbox mode
        if (isGroup && !config.groupMode) return false;
        if (isPrivate && !config.inboxMode) return false;

        return true;
    }

    // Start the bot
    async start() {
        console.log('🚀 Starting Telegram UserBot...');
        await this.initialize();
        console.log('✅ Bot is running! Press Ctrl+C to stop.');
    }

    // Stop the bot gracefully
    async stop() {
        if (this.client) {
            console.log('🔄 Disconnecting...');
            await this.client.disconnect();
            console.log('✅ Bot stopped successfully');
        }
    }
}

// Handle process termination
const bot = new TelegramUserBot();

process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await bot.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await bot.stop();
    process.exit(0);
});

// Start the bot
bot.start().catch(console.error);    }

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
