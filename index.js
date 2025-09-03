const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const fs = require('fs');
const config = require('./config.json');
const { connectDB } = require('./database/index');
const Chat = require('./database/Chat');
const { checkPermission } = require('./utils/permission');

// Load commands
const commands = {};
const loadCommands = async () => {
    const categories = ['cmd', 'admin', 'owner'];
    for (const category of categories) {
        const files = fs.readdirSync(`./scripts/${category}`);
        for (const file of files) {
            const command = require(`./scripts/${category}/${file}`);
            commands[command.command] = command;
        }
    }
};

const session = new StringSession(fs.readFileSync('./session/main.session', 'utf8'));

const client = new TelegramClient(session, config.apiId, config.apiHash, {
    connectionRetries: 5,
});

async function main() {
    await connectDB();
    await loadCommands();
    
    await client.start({
        phoneNumber: async () => await input.text('Please enter your number: '),
        password: async () => await input.text('Please enter your password: '),
        phoneCode: async () => await input.text('Please enter the code you received: '),
        onError: (err) => console.log(err),
    });
    
    console.log('Userbot started!');
    
    client.addEventHandler(async (event) => {
        try {
            const message = event.message;
            if (!message || !message.text) return;

            const text = message.text;
            if (!text.startsWith(config.prefix)) return;

            // Check if chat is allowed
            const isAllowed = await Chat.isAllowed(message.chatId.toString());
            if (!isAllowed && !config.ownerIds.includes(message.senderId.toString())) return;

            const args = text.slice(config.prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            if (commands[commandName]) {
                const command = commands[commandName];
                const hasPermission = await checkPermission(message.senderId.toString(), command.require);
                
                if (hasPermission) {
                    await command.run(client, message, args);
                } else {
                    await message.reply({ text: 'Insufficient permissions!' });
                }
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });
}

main().catch(console.error);
