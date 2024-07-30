from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import database

app = Flask(__name__)
CORS(app)  # This allows cross-origin requests

# default route
@app.route('/', methods=['GET'])
def home():
    return render_template('create.html')

@app.route('/chat.html', methods=['GET'])
def chat_page():
    return render_template('chat.html')

@app.route('/login.html', methods=['GET'])
def login_page():
    return render_template('login.html')

@app.route('/create.html', methods=['GET'])
def create_page():
    return render_template('create.html')
    
@app.route('/api/createAccount', methods=['POST'])
def create_account():
    data = request.json
    username = data["username"]
    check = database.check_user_exists(username)
    if check:
        return jsonify({"message": "Username Already Exists", "success": False})
    password = data["password"]
    print(f"Creating account for {username}, {password}")
    user_id = database.create_user(username, password)
    print(f"Account created with ID {user_id}")
    return jsonify({"message": "Account created", "id": user_id, "success": True})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data["username"]
    password = data["password"]
    print(f"Logging in with {username}, {password}")
    user_id = database.login(username, password)
    if user_id is not None:
        print(f"Logged in with ID {user_id}")
        return jsonify({"message": "Login successful", "id": user_id, "success": True})
    else:
        print("Login failed")
        return jsonify({"message": "Login failed", "success": False})

@app.route('/api/get_username', methods=['GET'])
def get_username():
    user_id = request.args.get('id')
    username = database.get_user(user_id)
    return jsonify({"username": username, "success": True})

@app.route('/api/messages', methods=['GET'])
def get_messages():
    channel = request.args.get('channel')
    messages = database.get_messages(channel)
    print("Received request for messages for channel", channel)
    json_messages = []
    for sender, id, message in messages:
        json_message = {
            'sender': sender,
            'message': message,
            'sender_id': id
        }
        json_messages.append(json_message)
    return jsonify({"messages": json_messages, "success": True})

@app.route('/api/get_channels', methods=['GET'])
def get_channels():
    user_id = request.args.get('id')
    print("Received request for channels for user", user_id)
    channels = database.get_user_channels(user_id)
    json_channels = []
    for id, name, private in channels:
        json_channel = {
            'id': id,
            'name': name,
            'private': private
        }
        json_channels.append(json_channel)
    return jsonify({"channels": json_channels, "success": True})

@app.route('/api/createChannel', methods=['POST'])
def create_channel():
    data = request.json
    member_id = data["member_id"]
    name = data["name"]
    channel_id = database.create_channel(name)
    database.add_channel_member(channel_id, member_id)
    return jsonify({"message": "Channel created", "id": channel_id, "success": True})

@app.route('/api/get_channel_members', methods=['GET'])
def get_channel_members():
    channel_id = request.args.get('id')
    members = database.get_channel_members(channel_id)
    json_members = []
    for id, username in members:
        json_member = {
            'id': id,
            'username': username
        }
        json_members.append(json_member)
    return jsonify({"members": json_members, "success": True})

@app.route('/api/check_for_private', methods=['GET'])
def check_for_private():
    user1 = request.args.get('id1')
    user1_channels = database.get_user_private_channels(user1)
    user2 = request.args.get('id2')
    user2_channels = database.get_user_private_channels(user2)
    print(user1_channels, user2_channels)
    for channel in user1_channels:
        if channel in user2_channels:
            return jsonify({"success": True, "channel": channel})
    return jsonify({"success": False})
    

@app.route('/api/create_private_channel', methods=['POST'])
def create_private_channel():
    data = request.json
    member_id = data["member_id"]
    other_id = data["other_id"]
    name = data["name"]
    channel_id = database.create_channel(name, True)
    database.add_channel_member(channel_id, member_id)
    database.add_channel_member(channel_id, other_id)
    database.print_channels()
    return jsonify({"message": "Private channel created", "id": channel_id, "success": True})
    
if __name__ == '__main__':
    database.init_db()
    app.run(debug=False, port=8080)
