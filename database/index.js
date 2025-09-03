const { MongoClient } = require('mongodb');
const config = require('../config.json');

let db;

async function connectDB() {
    try {
        const client = new MongoClient(config.mongoUrl);
        await client.connect();
        db = client.db();
        console.log('Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

function getDB() {
    return db;
}

module.exports = { connectDB, getDB };
