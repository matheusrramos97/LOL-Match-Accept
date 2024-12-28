const { app, Tray, Menu } = require('electron');
const { ApiClient } = require('./utils/apiClient');
const path = require('path');

let tray = null;

app.on('ready', () => {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Sair', click: () => app.quit() }
    ]);
    tray.setToolTip('LOL Match Accept');
    tray.setContextMenu(contextMenu);

    try {
        const api = new ApiClient(app);
        setInterval(async () => {
            await api.readyCheckAndAccept();
        }, 2000);
    } catch (error) {
        console.error(error.message);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});