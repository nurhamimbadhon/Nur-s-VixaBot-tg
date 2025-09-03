module.exports = async function actionHandler({ reaction, message, senderId, client }) {
  try {
    const chatId = message.chatId || message.peerId;
    console.log(`User ${senderId} reacted with ${reaction} on chat ${chatId}`);

    // Example: TCA/setReaction call
    // const setReaction = require("../TCA/setReaction");
    // await setReaction(client, chatId, message.id, "🙄");

  } catch (err) {
    console.error("❌ ActionHandler Error:", err);
  }
};
