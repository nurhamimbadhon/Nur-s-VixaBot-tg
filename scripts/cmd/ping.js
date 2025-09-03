module.exports = {
    command: 'ping',
    description: 'Check bot responsiveness',
    require: 0, // Anyone
    async run(client, message, args) {
        const start = Date.now();
        await message.edit({ text: 'Pong!' });
        const end = Date.now();
        await message.edit({ text: `Pong! ${end - start}ms` });
    }
};
