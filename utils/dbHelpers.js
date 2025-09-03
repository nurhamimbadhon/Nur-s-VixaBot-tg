const Chat = require('../database/Chat');
const User = require('../database/User');

async function addChat(chatId, addedBy) {
    await Chat.add(chatId, addedBy);
}

async function removeChat(chatId) {
    await Chat.remove(chatId);
}

async function addUser(userId, role, setBy) {
    await User.setRole(userId, role, setBy);
}

async function removeUser(userId) {
    await User.setRole(userId, 0, 'system');
}

module.exports = { addChat, removeChat, addUser, removeUser };
