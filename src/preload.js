const { contextBridge, ipcRenderer } = require('electron')
const { messageTypes } = require('./helpers/helpers')

const windowLoaded = new Promise((resolve) => {
    window.onload = resolve
})

ipcRenderer.on('main-port', async (event) => {
    await windowLoaded

    window.postMessage('main-port', '*', event.ports)
})

contextBridge.exposeInMainWorld('messageTypes', messageTypes);
