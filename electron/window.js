const { app, BrowserWindow } = require('electron')

app.commandLine.appendSwitch('--autoplay-policy','no-user-gesture-required')

function createWindow () {
    const win = new BrowserWindow({ 
        allowRunningInsecureContent: true,
        webPreferences: {
            additionalArguments: process.argv.slice(2),
            webSecurity: false
        }
    })
    win.loadURL('http://localhost:3000')
}

app.on('ready', createWindow)