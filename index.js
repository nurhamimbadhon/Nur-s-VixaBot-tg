const { TelegramClient } = require("@gramjs/gramjs");
const { StringSession } = require("@gramjs/gramjs/sessions");
const input = require("input");
const fs = require("fs");
const path = require("path");
const config = require('./config.json');
const { connectDB } = require('./database/index');
const Chat = require('./database/Chat');
const User = require('./database/User');
const { checkPermission } = require('./utils/permission');

// Load commands
const commands = {};
const loadCommands = async () => {
    const categories = ['cmd', 'admin', 'owner'];
    for (const category of categories) {
        const categoryPath = path.join(__dirname, 'scripts', category);
        if (fs.existsSync(categoryPath)) {
            const files = fs.readdirSync(categoryPath);
            for (const file of files) {
                if (file.endsWith('.js')) {
                    try {
                        const command = require(path.join(categoryPath, file));
                        commands[command.command] = command;
                        console.log(`Loaded command: ${command.command}`);
                    } catch (error) {
                        console.error(`Error loading command ${file}:`, error);
                    }
                }
            }
        }
    }
};

// Read session from file
let sessionString = '';
const sessionPath = path.join(__dirname, 'session', 'main.session');
if (fs.existsSync(sessionPath)) {
    sessionString = fs.readFileSync(sessionPath, 'utf8').trim();
    console.log('Session file found and loaded');
} else {
    console.log('No session file found. A new one will be created after login.');
}

const stringSession = new StringSession(sessionString);
const client = new TelegramClient(stringSession, config.apiId, config.apiHash, {
    connectionRetries: 5,
});

async function main() {
    await connectDB();
    await loadCommands();
    
    console.log('Connecting to Telegram...');
    
    // Start the client
    await client.start({
        phoneNumber: async () => await input.text('Please enter your number: '),
        password: async () => await input.text('Please enter your password: '),
        phoneCode: async () => await input.text('Please enter the code you received: '),
        onError: (err) => console.log('Connection error:', err),
    });
    
    // Save the session string to file
    const newSessionString = client.session.save();
    if (newSessionString !== sessionString) {
        // Ensure session directory exists
        const sessionDir = path.dirname(sessionPath);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        
        fs.writeFileSync(sessionPath, newSessionString);
        console.log('Session saved to:', sessionPath);
    }
    
    const me = await client.getMe();
    console.log('Userbot started!');
    console.log('Logged in as:', me.username || me.firstName);
    
    // Add event handler for new messages
    client.addEventHandler(async (update) => {
        try {
            if (update.className !== 'UpdateNewMessage') return;
            
            const message = update.message;
            if (!message || !message.message) return;
            
            const text = message.message;
            if (!text.startsWith(config.prefix)) return;
            
            // Get chat ID and sender ID
            const chatId = message.chatId.value.toString();
            const senderId = message.senderId.value.toString();
            
            // Check if chat is allowed
            const isAllowed = await Chat.isAllowed(chatId);
            if (!isAllowed && !config.ownerIds.includes(senderId)) return;
            
            const args = text.slice(config.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            if (commands[commandName]) {
                const command = commands[commandName];
                const hasPermission = await checkPermission(senderId, command.require);
                
                if (hasPermission) {
                    await command.run(client, message, args);
                } else {
                    await client.sendMessage(chatId, {
                        message: "Insufficient permissions!",
                        replyTo: message.id
                    });
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
    
    console.log('Listening for messages...');
    
    // Keep the client running
    await client.runUntilDisconnected();
}

main().catch(console.error);
