// CHANNEL FUNCTIONS //
const url = 'http://68.183.31.37:80/';
// Handle Channel Listener
let current_channel = 1;
let client_id;
let user_channel_list = [];

window.api.onCurrentChannelChanged((value) => {
    current_channel = value;
    // getMessages(current_channel);
});
// Handle Setting a new channel
async function setChannel(channel) {
    current_channel = channel;
    // window.api.setCurrentChannel(channel);
}
async function initialize() {
    await getClientId();
    const username = await getUsername();
    const header = document.getElementById('header');
    header.textContent = 'Welcome ' + username;
    await setChannel(current_channel);
    getMessages(current_channel);
    updateChannelList();
}
initialize();

// Get the client ID from the main process
async function getClientId() {
    try {
        const id = await window.api.getClientId();
        client_id = id;
        console.log('Client ID:', client_id);
    } catch (error) {
        console.error('Error getting client ID:', error);
    }
}

// Get the username from the server
async function getUsername() {
    // Make a GET request to the server to get the username
    fetch(`${url}api/get_username?id=${client_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Username retrieved successfully');
                const header = document.getElementById('header');
                header.textContent = 'Welcome ' + data.username;
            }
        })
        .catch(error => console.error('Error:', error));
}

// Update the list of channels
async function updateChannelList() {
    // Make a GET request to the server to get the list of channels the user is in
    let channel_list;
    await fetch(`${url}api/get_channels?id=${client_id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Channel list updated successfully');
                channel_list = data.channels;
            }
        })
        .catch(error => console.error('Error:', error));

    const client_list = document.getElementById('users');
    client_list.innerHTML = '';
    const addChannelPromises = channel_list.map(async channel => {
        if (!user_channel_list.includes(channel.id)) {
            user_channel_list.push(channel.id);
        }
        // Handle private channels
        if (channel.private){
            await fetch(`${url}api/get_channel_members?id=${channel.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        data.members.forEach(member => {
                            if (member.id != client_id) {
                                return addChannel(channel.id, member.username);
                            }
                        });
                    }
                })
                .catch(error => console.error('Error:', error));
        }
        else{
            return addChannel(channel.id, channel.name);
        }
    });

    await Promise.all(addChannelPromises);
    console.log('Channel list update completed');
}

// Create a private channel between two users
function createPrivateChannel(to_user_id, channel_name) {
    // Send a POST request to the server to create a channel
    const data = {
        name: channel_name,
        member_id: client_id,
        other_id: to_user_id,
    };
    fetch(url+'api/create_private_channel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then(response => response.json())
        .then(async data => {
            if (data.success) {
                console.log('Channel created successfully');
                await setChannel(data.id);
                getMessages(current_channel)
                updateChannelList();
            }
        })
        .catch(error => console.error('Error:', error));
}

// Adds a channel to the list of channels
function addChannel(channel_id, channel_name){
    const client_list = document.getElementById('users');
    const client = document.createElement('button');
    client.textContent = channel_name;
    client.dataset.channelID = channel_id;
    client.addEventListener('click', async () => {
        if (current_channel == client.dataset.channelID) {
            return;
        }
        // Change the color of the current channel and the old channel
        const clients = client_list.getElementsByTagName('button');
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].dataset.channelID == current_channel) {
                clients[i].style.backgroundColor = '';
            }
        }
        client.style.backgroundColor = 'green';
        await setChannel(client.dataset.channelID);
        getMessages(current_channel);
    });
    if (channel_id == current_channel) {
        client.style.backgroundColor = 'green';
    }
    let li = document.createElement('li');
    li.appendChild(client);
    client_list.appendChild(li);
}

// Get the list of users in the channel
function getChannelUsers(){
    // Make a GET request to the server to get the list of users in the channel
    fetch(`${url}api/get_channel_members?id=${current_channel}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Users retrieved successfully');
                const client_list = document.getElementById('users');
                client_list.innerHTML = '';            
                data.members.forEach(member => {
                    addUser(member.id, member.username);
                });
            }
        })
        .catch(error => console.error('Error:', error));
}

async function addUser(user_id, username) {
    const client_list = document.getElementById('users');
    const client = document.createElement('button');
    client.textContent = username;
    client.dataset.userId = user_id;
    if (user_id == client_id) {
        client.style.backgroundColor = 'lightblue';
        let li = document.createElement('li');
        li.appendChild(client);
        client_list.appendChild(li);
        return;
    }
    client.addEventListener('click', async () => {
        let check = await checkForPrivate(client.dataset.userId);
        if (!check) {
            console.log('Creating private channel');
            createPrivateChannel(client.dataset.userId, user_id + ' and ' + client_id);
        }
    });

    let li = document.createElement('li');
    li.appendChild(client);
    client_list.appendChild(li);
}

async function checkForPrivate(to_user_id) {
    try {
        const response = await fetch(`${url}api/check_for_private?id1=${client_id}&id2=${to_user_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        if (data.success) {
            console.log('Channel retrieved successfully');
            await setChannel(data.channel[0]);
            getMessages(current_channel);
            updateChannelList();
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

// Get the messages in the channel
function getMessages(channel) {
    // Make a GET request to the server to get the messages in the channel
    fetch(`${url}api/messages?channel=${channel}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Messages retrieved successfully');
                clearMessages();
                data.messages.forEach(msg => {
                    if (msg.sender_id == client_id) {
                        appendMessage('You: ' + msg.message);
                    }
                    else {
                        appendMessage(msg.sender + ': ' + msg.message);
                    }
                });
            }
        })
        .catch(error => console.error('Error:', error));
}

// Append a message to the messages div
function appendMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('p');
    const line = document.createElement('hr');
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.appendChild(line);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Clear the messages div
function clearMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
}