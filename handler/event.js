const Config = require("../database/Config");
const User = require("../database/User");
const commandLoader = require("../utils/commandLoader");

// Cache to reduce DB hits
let cfgCache = null;

module.exports = async function eventHandler(event, client) {
  try {
    const message = event.message;
    if (!message) return;

    // Load config from DB or fallback
    if (!cfgCache) {
      cfgCache = await Config.findOne({});
      if (!cfgCache) {
        const cfgJson = require("../config.json");
        cfgCache = await Config.create({
          prefix: cfgJson.prefix,
          selfListen: cfgJson.selfListen,
          adminOnly: cfgJson.adminOnly,
          ownerOnly: cfgJson.ownerOnly,
          groupMode: cfgJson.groupMode,
          inboxMode: cfgJson.inboxMode,
          admins: cfgJson.adminIds,
          owners: cfgJson.ownerIds,
          whitelist: cfgJson.whitelistIds
        });
      }
    }
    const cfg = cfgCache;

    const senderId = String(message.senderId || message.fromId);
    const text = message.message || "";
    const isGroup = event.isGroup;

    // SelfListen OFF → ignore own messages
    if (!cfg.selfListen && senderId === String(client.session.userId)) return;

    // Group/Inbox toggle
    if (isGroup && !cfg.groupMode) return;
    if (!isGroup && !cfg.inboxMode) return;

    // AdminOnly / OwnerOnly global check
    if (cfg.ownerOnly && !cfg.owners.includes(senderId)) return;
    if (cfg.adminOnly && !cfg.admins.includes(senderId)) return;

    // Command detection
    if (!text.startsWith(cfg.prefix)) return;
    const args = text.slice(cfg.prefix.length).trim().split(/\s+/);
    const cmdName = args.shift().toLowerCase();

    const cmd = commandLoader(cmdName);
    if (!cmd) return;

    // Per-command role check
    const role = cmd.config?.role || 0;
    if (role === 3 && !cfg.owners.includes(senderId))
      return event.reply("❌ Only owner can use this command!");
    if (role === 2 && !cfg.admins.includes(senderId))
      return event.reply("❌ Admins only!");
    if (role === 1 && !cfg.whitelist.includes(senderId))
      return event.reply("❌ Whitelist only!");

    // Build event object
    const ev = {
      chatId: event.chatId,
      args,
      text,
      senderId,
      replyToMsgId: message.replyTo?.replyToMsgId,
      raw: message,
      event
    };

    // Execute command
    await cmd.run({ client, event: ev, config: cfg });

  } catch (err) {
    console.error("❌ EventHandler Error:", err);
  }
};
