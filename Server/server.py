import asyncio
import websockets
import json
import database

## TODO:
### - Add notifications for channels when a user is offline
### - Add a way to tell if a user is online or offline
# Need to add an online status to the User table

# Store connected clients
clients = {}

async def handle_client(websocket, path):
    username = None
    user_id = None
    try:
        async for message in websocket:
            data = json.loads(message)
            print(data)
            # Join chat
            if data["type"] == "join":
                user_id = int(data["id"])
                username = database.get_user(data["id"])[0]
                clients[(user_id)] = {"websocket": websocket, "username": username}
                await broadcast(f"{username} has joined the chat.", None, username)
            # Broadcast message
            elif data["type"] == "broadcast":
                await broadcast(data["message"], data["id"], username)
            # Private message
            elif data["type"] == "private":
                await send_private_message(data["id"], data["message"], username, data["channel"])
    # Handle exceptions
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Connection closed for user {username} (ID: {user_id}): {e.code} {e.reason}")
    except json.JSONDecodeError:
        print(f"Invalid JSON received from user {username} (ID: {user_id})")
    except Exception as e:
        print(f"An error occurred for user {username} (ID: {user_id}): {str(e)}")
    # Logout
    finally:
        # Remove client when connection is closed
        print(f"Removing user {username} (ID: {user_id})")
        await handle_disconnection(user_id, username)

async def handle_logout(user_id, username):
    if user_id in clients:
        del clients[user_id]
        await broadcast(f"{username} has logged out.", None, username)

async def handle_disconnection(user_id, username):
    if user_id is not None and user_id in clients:
        del clients[(user_id)]
        await broadcast(f"{username} has disconnected.", None, username)

async def broadcast(message, sender_id, username):
    if clients:
        sender_name = "Server" if sender_id is None else username
        broadcast_message = json.dumps({"type": "broadcast", "sender_id": sender_id, "sender": sender_name, "message": message})
        print(clients)
        await asyncio.gather(
            *(client["websocket"].send(broadcast_message) for client in clients.values())
        )
        if sender_id is not None:
            database.save_message(1, sender_name, sender_id, message)

async def send_private_message(sender_id, message, username, channel):
    try:
        sender_name = username
        channel_members = database.get_channel_members(channel)
        private_message = json.dumps({"type": "private", "sender_id": sender_id, "sender": sender_name, "message": message, "channel": channel})
        for member_id, member_name in channel_members:
            if int(member_id) in clients:
                await clients[member_id]["websocket"].send(private_message)
        database.save_message(channel, sender_name, sender_id, message)
    except ValueError:
        error_message = json.dumps({"type": "error", "message": "Invalid user ID"})
        await clients[sender_id]["websocket"].send(error_message)

async def main():
    database.init_db()
    async with websockets.serve(handle_client, "localhost", 8000):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
