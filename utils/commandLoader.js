const fs = require("fs");
const path = require("path");

module.exports = function loadCommands() {
  const cmds = new Map();
  const base = path.join(__dirname, "../script/cmd");
  const files = fs.readdirSync(base).filter(f => f.endsWith(".js"));
  for (const file of files) {
    const c = require(path.join(base, file));
    cmds.set(c.config.name, c);
  }
  console.log("🧩 Commands loaded:", [...cmds.keys()].join(", "));
  return cmds;
};
