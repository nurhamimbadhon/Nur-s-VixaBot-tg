from telethon import TelegramClient
import os
import asyncio

# Ask for API ID & HASH
API_ID = int(input("🔑 Enter your API ID: ").strip())
API_HASH = input("🔑 Enter your API HASH: ").strip()

# Session file in current folder
SESSION_PATH = os.path.join(os.getcwd(), "main.session")

async def main():
    client = TelegramClient(SESSION_PATH, API_ID, API_HASH)
    await client.start()  # prompts for phone/code/2FA
    print("✅ Logged in! Session saved at:", SESSION_PATH)
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())