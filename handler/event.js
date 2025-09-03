import Config from "../database/Config.js";
import User from "../database/User.js";
import commandLoader from "../utils/commandLoader.js";

// Cache to reduce DB hits
let cfgCache = null;

export default async function eventHandler(event, client, commands, configJson) {
  try {
    const message = event.message;
    if (!message) return;

    // Load config from DB or fallback
    if (!cfgCache) {
      try {
        cfgCache = await Config.findOne({});
        if (!cfgCache) {
          cfgCache = await Config.create({
            prefix: configJson.prefix,
            selfListen: configJson.selfListen,
            adminOnly: configJson.adminOnly,
            ownerOnly: configJson.ownerOnly,
            groupMode: configJson.groupMode,
            inboxMode: configJson.inboxMode,
            admins: configJson.adminIds,
            owners: configJson.ownerIds,
            whitelist: configJson.whitelistIds
          });
        }
      } catch (dbError) {
        console.warn("⚠️ Database config not available, using config.json:", dbError.message);
        cfgCache = configJson; // Fallback to config.json
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
    const owners = cfg.owners || cfg.ownerIds || [];
    const admins = cfg.admins || cfg.adminIds || [];
    const whitelist = cfg.whitelist || cfg.whitelistIds || [];

    if (cfg.ownerOnly && !owners.includes(senderId)) return;
    if (cfg.adminOnly && !admins.includes(senderId)) return;

    // Command detection
    if (!text.startsWith(cfg.prefix)) return;
    const args = text.slice(cfg.prefix.length).trim().split(/\s+/);
    const cmdName = args.shift().toLowerCase();

    const cmd = await commandLoader(cmdName);
    if (!cmd) return;

    // Per-command role check
    const role = cmd.config?.role || 0;
    if (role === 3 && !owners.includes(senderId)) {
      return await client.sendMessage(event.chatId, { message: "❌ Only owner can use this command!" });
    }
    if (role === 2 && !admins.includes(senderId)) {
      return await client.sendMessage(event.chatId, { message: "❌ Admins only!" });
    }
    if (role === 1 && !whitelist.includes(senderId)) {
      return await client.sendMessage(event.chatId, { message: "❌ Whitelist only!" });
    }

    // Build event object
    const ev = {
      chatId: event.chatId,
      args,
      text,
      senderId,
      replyToMsgId: message.replyTo?.replyToMsgId,
      raw: message,
      event,
      reply: async (msg) => {
        return await client.sendMessage(event.chatId, { 
          message: msg,
          replyTo: message.id
        });
      }
    };

    // Execute command
    if (cmd.run) {
      await cmd.run({ client, event: ev, config: cfg });
    } else if (typeof cmd === 'function') {
      await cmd({ client, event: ev, config: cfg });
    }

  } catch (err) {
    console.error("❌ EventHandler Error:", err);
  }
          }
