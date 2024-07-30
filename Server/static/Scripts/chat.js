import {appendMessage, updateChannelList, current_channel, user_channel_list} from './channels.js';
let ws = null;
let client_id;

window.sendMessage = sendMessage;
window.logout = logout;

function initWebSocket() {
    ws = new WebSocket('ws://127.0.0.1:8000');

    ws.onopen = () => {
        console.log('Connected to WebSocket server');
        client_id = localStorage.getItem('clientId');
        let info_message = {
            'type': 'join',
            'id': client_id,
        };
        ws.send(JSON.stringify(info_message));
    };

    ws.onmessage = (event) => {
        let message = JSON.parse(event.data);
        console.log('Received message:', message);
        handleMessage(message);
    };

    ws.onclose = (event) => {
        console.log('Disconnected from WebSocket server');
        console.log(event);
        appendMessage('Disconnected from WebSocket server');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        appendMessage('Error: ' + error.message);
    };
}

// HANDLE MESSAGES //

async function handleMessage(message) {
    let type = message['type'];
    let sender = message['sender'];
    let sender_id = message['sender_id'];
    let messageText = message['message'];
    if (type === 'broadcast') {
        if (current_channel.value != 1) {
            return;
        }
        if (sender_id == client_id) {
            appendMessage('You: ' + messageText);
        }
        else {
            appendMessage(sender + ': ' + messageText);
        }
    } else if (type === 'private') {
        let sent_channel = message['channel'];
        if (!user_channel_list.value.includes(parseInt(sent_channel))) {
            await updateChannelList();
        }
        if (current_channel.value != sent_channel) {
            addNotification(sent_channel);
            return;
        }
        if (sender_id == client_id) {
            appendMessage('You: ' + messageText);
        }
        else {
            appendMessage('Private from ' + sender + ': ' + messageText);
        }
    }
    else if (type === 'error') {
        appendMessage('Error: ' + messageText);
    }
    else {
        console.log('Unknown message type:', type);
    }
}

// EVENT LISTENERS //

// Handle the enter key to send messages
const text_input = document.getElementById('messageInput');
text_input.addEventListener('keyup', function (event) {
    if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
    } else if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
});

// Adjust the height of the textarea based on the content
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('messageInput');

    const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    };
    textarea.addEventListener('input', adjustHeight);
    adjustHeight();
});

// FUNCTIONS //

// Add a notification to the channel with the matching ID
function addNotification(channel_id) {
    console.log('Adding notification to channel:', channel_id);
    // Loop through the client list and find the user with the matching ID
    const client_list = document.getElementById('users');
    const clients = client_list.getElementsByTagName('button');
    for (let i = 0; i < clients.length; i++) {
        if (parseInt(clients[i].dataset.channelID) === parseInt(channel_id)) {
            // Add a notification to the user
            clients[i].style.backgroundColor = 'red';
            break;
        }
    }
}

// Logout the user
async function logout() {
    // Close the WebSocket connection
    await ws.close();
    window.location.href = 'login.html'
}

// Send a message to the WebSocket server
function sendMessage() {
    if (current_channel.value != 1) {
        sendPrivateMessage();
    } else {
        sendPublicMessage();
    }
}

// Send a public message to the WebSocket server
function sendPublicMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if (message) {
        ws.send(JSON.stringify({ type: 'broadcast', message: message, "id": client_id, "channel": current_channel.value }));
        messageInput.value = '';
    } else {
        console.log('Message is empty');
    }
}

// Send a private message to user with ID to_user_id
function sendPrivateMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value;
    if (message) {
        ws.send(JSON.stringify({ type: 'private', message: message, "id": client_id, "channel": current_channel.value }));
        messageInput.value = '';
    } else {
        console.log('Message is empty');
    }
}

document.addEventListener('DOMContentLoaded', initWebSocket);
