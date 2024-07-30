const url = 'http://127.0.0.1:8080/';
export const current_channel = {value : 1};
export const user_channel_list = {value : []};
let client_id;

window.updateChannelList = updateChannelList;
window.getChannelUsers = getChannelUsers;

async function initialize() {
    client_id = localStorage.getItem('clientId');
    const username = await getUsername();
    const header = document.getElementById('header');
    header.textContent = 'Welcome ' + username;
    getMessages(current_channel.value);
    updateChannelList();
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
export async function updateChannelList() {
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
        if (!user_channel_list.value.includes(channel.id)) {
            user_channel_list.value.push(channel.id);
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
                current_channel.value = data.id;
                getMessages(current_channel.value)
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
        if (current_channel.value == client.dataset.channelID) {
            return;
        }
        // Change the color of the current channel and the old channel
        const clients = client_list.getElementsByTagName('button');
        for (let i = 0; i < clients.length; i++) {
            if (clients[i].dataset.channelID == current_channel.value) {
                clients[i].style.backgroundColor = '';
            }
        }
        client.style.backgroundColor = 'green';
        current_channel.value = client.dataset.channelID;
        getMessages(current_channel.value);
    });
    if (channel_id == current_channel.value) {
        client.style.backgroundColor = 'green';
    }
    let li = document.createElement('li');
    li.appendChild(client);
    client_list.appendChild(li);
}

// Get the list of users in the channel
function getChannelUsers(){
    // Make a GET request to the server to get the list of users in the channel
    fetch(`${url}api/get_channel_members?id=${current_channel.value}`, {
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
            current_channel.value = data.channel[0];
            getMessages(current_channel.value);
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
export function appendMessage(message) {
    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('p');
    const line = document.createElement('hr');
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.appendChild(line);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Clear the messages div
export function clearMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', initialize);

