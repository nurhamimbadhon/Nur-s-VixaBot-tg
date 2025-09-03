from telethon import TelegramClient
import os
import asyncio
API_ID = int(input("🔑 Enter your API ID: ").strip())
API_HASH = input("🔑 Enter your API HASH: ").strip()

SESSION_PATH = os.path.join(os.getcwd(), "main.session")

async def main():
    client = TelegramClient(SESSION_PATH, API_ID, API_HASH)
    await client.start() 
    print("✅ Logged in! Session saved at:", SESSION_PATH)
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
