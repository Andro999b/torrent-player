const { app, BrowserWindow } = require('electron')

function createWindow () {
    const win = new BrowserWindow({ 
        allowRunningInsecureContent: true,
        webPreferences: {
            additionalArguments: process.argv.slice(2)
        }
    })
    win.loadURL('http://localhost:3000')
}

app.on('ready', createWindow)