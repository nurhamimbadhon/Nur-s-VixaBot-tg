const { getDB } = require('./index');

class Chat {
    static async isAllowed(chatId) {
        const db = getDB();
        return await db.collection('chats').findOne({ chatId });
    }

    static async add(chatId, addedBy) {
        const db = getDB();
        await db.collection('chats').updateOne(
            { chatId },
            { $set: { addedBy, timestamp: new Date() } },
            { upsert: true }
        );
    }

    static async remove(chatId) {
        const db = getDB();
        await db.collection('chats').deleteOne({ chatId });
    }
}

module.exports = Chat;
