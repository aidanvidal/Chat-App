import sqlite3

# Database connection
def init_db():
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    # Create users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE,
                  password TEXT)''')
    # Create a messages table
    c.execute('''CREATE TABLE IF NOT EXISTS messages
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                 channel_id INTEGER,
                 sender TEXT,
                 sender_id INTEGER,
                 message TEXT,
                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    # Create a table for public channels
    c.execute('''CREATE TABLE IF NOT EXISTS channels
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                 name TEXT UNIQUE,
                 private BOOLEAN DEFAULT FALSE)''')
    # Create a table for the members of a channel
    c.execute('''CREATE TABLE IF NOT EXISTS channel_members
                    (channel_id INTEGER,
                    member_id INTEGER,
                    FOREIGN KEY(channel_id) REFERENCES channels(id),
                    FOREIGN KEY(member_id) REFERENCES users(id),
                    PRIMARY KEY(channel_id, member_id))''')
    
    # Create the main channel for all users if it doesn't exist
    c.execute("SELECT id FROM channels WHERE name = 'Main'")
    main_channel = c.fetchone()
    if main_channel is None:
        c.execute("INSERT INTO channels (id, name) VALUES (1, 'Main')")
    
    conn.commit()
    conn.close()

def create_user(username, password):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
    user_id = c.lastrowid  # Get the ID assigned to the user
    
    # Add the user to the main channel
    main_channel = 1
    if main_channel is not None:
        c.execute("INSERT INTO channel_members (channel_id, member_id) VALUES (?, ?)", (main_channel, user_id))
    
    conn.commit()
    conn.close()
    return user_id

def login(username, password):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE username = ? AND password = ?", (username, password))
    user = c.fetchone()
    conn.close()
    return user[0] if user is not None else None

def get_user(id):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT username FROM users WHERE id = ?", (id,))
    user = c.fetchone()
    conn.close()
    return user

def check_user_exists(username):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT id FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    return user is not None
    
def create_channel(name, private=False):
    print("Creating channel", name)
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("INSERT INTO channels (name, private) VALUES (?, ?)", (name, private))
    channel_id = c.lastrowid
    conn.commit()
    conn.close()
    return channel_id

def add_channel_member(channel_id, member_id):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("INSERT INTO channel_members (channel_id, member_id) VALUES (?, ?)", (channel_id, member_id))
    conn.commit()
    conn.close()
    
def get_user_channels(user_id):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT channels.id, channels.name, channels.private FROM channels INNER JOIN channel_members ON channels.id = channel_members.channel_id WHERE channel_members.member_id = ?", (user_id,))
    channels = c.fetchall()
    conn.close()
    return channels

def get_channel_members(channel_id):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT users.id, users.username FROM users INNER JOIN channel_members ON users.id = channel_members.member_id WHERE channel_members.channel_id = ?", (channel_id,))
    members = c.fetchall()
    conn.close()
    return members
    
def save_message(channel, sender, sender_id, message):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("INSERT INTO messages (channel_id, sender, sender_id, message) VALUES (?, ?, ?, ?)", (channel, sender, sender_id, message))
    conn.commit()
    conn.close()
    
def get_messages(channel_id, limit=50):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT sender, sender_id, message FROM messages WHERE channel_id = ? ORDER BY TIMESTAMP DESC LIMIT ?", (channel_id, limit))
    messages = c.fetchall()[::-1]
    conn.close()
    return messages

def get_user_private_channels(user):
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT channels.id, channels.name FROM channels INNER JOIN channel_members ON channels.id = channel_members.channel_id WHERE channel_members.member_id = ? AND channels.private = 1", (user,))
    channels = c.fetchall()
    conn.close()
    return channels

def print_channels():
    conn = sqlite3.connect('chat.db')
    c = conn.cursor()
    c.execute("SELECT * FROM channels")
    channels = c.fetchall()
    print("Channels:")
    for channel in channels:
        print("Channel ID:", channel[0])
        print("Channel Name:", channel[1])
        print("Private:", channel[2])
        print("Members:")
        c.execute("SELECT users.username FROM users INNER JOIN channel_members ON users.id = channel_members.member_id WHERE channel_members.channel_id = ?", (channel[0],))
        members = c.fetchall()
        for member in members:
            print(member[0])
        print("--------------------")
    conn.close()