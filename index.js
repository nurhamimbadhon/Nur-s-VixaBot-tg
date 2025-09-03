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

    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        if (!fs.existsSync(commandsPath)) fs.mkdirSync(commandsPath, { recursive: true });

        const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
        for (const file of commandFiles) {
            const commandPath = path.join(commandsPath, file);
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            if (command.name && command.execute) {
                this.commands.set(command.name, command);
                console.log(`✅ Loaded command: ${command.name}`);
            }
        }
    }

    async initialize() {
        const sessionDir = path.join(__dirname, 'session');
        if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

        const sessionPath = path.join(sessionDir, 'main.session');
        let session = new StringSession('');
        if (fs.existsSync(sessionPath)) session = new StringSession(fs.readFileSync(sessionPath, 'utf8'));

        this.client = new TelegramClient(session, config.apiId, config.apiHash, { connectionRetries: 5 });

        console.log('🔄 Connecting to Telegram...');
        await this.client.start();
        fs.writeFileSync(sessionPath, this.client.session.save());

        const me = await this.client.getMe();
        console.log(`✅ Connected as: ${me.firstName} ${me.lastName || ''} (@${me.username || 'N/A'})`);

        this.client.addEventHandler(async (update) => {
            if (update.className === 'UpdateNewMessage') await this.handleMessage(update.message);
        });

        console.log('👂 Event handlers set up successfully');
    }

    async handleMessage(message) {
        if (!message.message) return;
        const text = message.message;
        if (!text.startsWith(config.prefix)) return;

        const args = text.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        if (!this.commands.has(commandName)) return;

        const command = this.commands.get(commandName);
        const sender = await message.getSender();

        console.log(`🎯 Executing command: ${commandName} by ${sender.firstName || 'Unknown'}`);

        await command.execute({ client: this.client, message, args, sender, config });
    }

    async start() {
        console.log('🚀 Starting Telegram UserBot...');
        await this.initialize();
        console.log('✅ Bot is running! Press Ctrl+C to stop.');
    }

    async stop() {
        if (this.client) {
            console.log('🔄 Disconnecting...');
            await this.client.disconnect();
            console.log('✅ Bot stopped successfully');
        }
    }
}

const bot = new TelegramUserBot();

// Handle termination signals
['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, async () => {
        console.log(`\n🛑 Received ${sig}, shutting down...`);
        await bot.stop();
        process.exit(0);
    });
});

// Start the bot
bot.start().catch(console.error);
