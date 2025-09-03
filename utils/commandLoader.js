import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function commandLoader() {
  const commands = {};
  const commandsPath = path.join(__dirname, '..', 'commands');

  try {
    if (!fs.existsSync(commandsPath)) {
      console.warn(`Commands directory not found: ${commandsPath}`);
      return commands;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      try {
        const commandModule = await import(path.join(commandsPath, file));
        const command = commandModule.default || commandModule;
        
        if (command && command.name) {
          commands[command.name] = command.execute || command;
          console.log(`✅ Loaded command: ${command.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load command from ${file}:`, error.message);
      }
    }

    return commands;
  } catch (error) {
    console.error('Error loading commands:', error);
    return commands;
  }
}
