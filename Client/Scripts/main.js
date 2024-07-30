const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let clientId;
let current_channel;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('create.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle Change HTML requests from renderer
ipcMain.on('change-html', (event, htmlFile) => {
    mainWindow.loadFile(htmlFile);
});

// Get client ID
ipcMain.handle('getClientid', () => clientId);

// Set client ID
ipcMain.on('setClientid', (event, value) => {
    clientId = value;
    mainWindow.webContents.send('shareClientid', clientId);
});

// Get current channel
ipcMain.handle('getCurrentChannel', () => ipcRenderer.invoke('getCurrentChannel'));

// Set current channel
ipcMain.on('setCurrentChannel', (event, value) => {
    current_channel = value;
    mainWindow.webContents.send('shareCurrentChannel', current_channel);
});