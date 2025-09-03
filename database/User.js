const { getDB } = require('./index');

class User {
    static async getRole(userId) {
        const db = getDB();
        const user = await db.collection('users').findOne({ userId });
        return user ? user.role : 0;
    }

    static async setRole(userId, role, setBy) {
        const db = getDB();
        await db.collection('users').updateOne(
            { userId },
            { $set: { role, setBy, timestamp: new Date() } },
            { upsert: true }
        );
    }
}

module.exports = User;
