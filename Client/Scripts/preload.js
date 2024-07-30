// preload.js
const { ipcRenderer } = require('electron');

// Expose protected methods directly on window object
window.api = {
    // General send and receive methods
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    
    // Specific methods for shared variable (client ID in this case)
    getClientId: () => ipcRenderer.invoke('getClientid'),
    setClientId: (value) => ipcRenderer.send('setClientid', value),
    onClientIdChanged: (callback) => ipcRenderer.on('shareClientid', (event, value) => callback(value)),
    // Shared Variable current channel
    getCurrentChannel: () => ipcRenderer.invoke('getCurrentChannel'),
    setCurrentChannel: (value) => ipcRenderer.send('setCurrentChannel', value),
    onCurrentChannelChanged: (callback) => ipcRenderer.on('shareCurrentChannel', (event, value) => callback(value)),
};