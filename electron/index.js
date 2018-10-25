const { app, BrowserWindow, globalShortcut } = require('electron')
const { fork } = require('child_process')

const castScrean = process.argv.indexOf('--cast-screan') != -1
let serverProcess

function appReady() {
    serverProcess = fork('./server/index.js')
        .on('error', () => process.exit(127))
        .on('message', createMainWindow)
}

function createMainWindow () {
    const win = new BrowserWindow({ 
        allowRunningInsecureContent: true,
        fullscreen: castScrean,
        webPreferences: {
            additionalArguments: process.argv.slice(2),
            webSecurity: false
        },
        show: false,
        backgroundThrottling: false
    })
    win.loadURL('http://localhost:8080')
    win.setMenu(null)
    win.on('ready-to-show', () => {
        win.maximize()
        win.show()
    })
    win.on('close', () => serverProcess.kill())

    globalShortcut.register('F11', () => {
        win.setFullScreen(!win.isFullScreen())
    })
}

app.on('ready', appReady)