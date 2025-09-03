const { Api } = require("telegram");

module.exports = async function setReaction(client, peer, msgId, emoji) {
  try {
    await client.invoke(
      new Api.messages.SendReaction({
        peer,
        msgId: Number(msgId),
        reaction: [
          new Api.ReactionEmoji({ emoticon: emoji })
        ],
        addToRecent: true
      })
    );
    return true;
  } catch (err) {
    console.error("setReaction error:", err);
    throw err;
  }
};
