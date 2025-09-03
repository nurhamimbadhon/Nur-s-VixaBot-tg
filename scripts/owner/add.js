const { addChat, addUser } = require('../../utils/dbHelpers');

module.exports = {
    command: 'add',
    description: 'Add chat/user to allowed list',
    require: 2, // Owner only
    async run(client, message, args) {
        const replyTo = await message.getReplyMessage();
        
        if (replyTo) {
            // Add user
            const targetUser = replyTo.senderId;
            await addUser(targetUser, 1, message.senderId);
            await message.edit({ text: `User ${targetUser} added as admin` });
        } else {
            // Add chat
            const chatId = message.chatId;
            await addChat(chatId, message.senderId);
            await message.edit({ text: `Chat ${chatId} added to allowed list` });
        }
    }
};
