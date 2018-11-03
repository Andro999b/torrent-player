const { app, BrowserWindow, globalShortcut } = require('electron')
const { fork } = require('child_process')

const fullscreen = 
    process.argv.indexOf('--cast-screen') != -1 ||
    process.argv.indexOf('--fullscreen') != -1
    
let serverProcess

function appReady() {
    serverProcess = fork('./server/index.js')
        .on('exit', (code, signal) => {
            console.error(`Server process exited. code: ${code}, signal: ${signal}`)
            process.exit()
        })
        .on('error', () => {
            console.error('Server process exited with error')
            process.exit(127)
        })
        .on('message', createMainWindow)
}

function createMainWindow () {
    const win = new BrowserWindow({ 
        allowRunningInsecureContent: true,
        fullscreen,
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
        !fullscreen && win.maximize()
        win.show()
    })

    globalShortcut.register('F11', () => {
        win.setFullScreen(!win.isFullScreen())
    })
}

app.commandLine.appendSwitch('--autoplay-policy','no-user-gesture-required')
app.on('ready', appReady)
app.on('window-all-closed', () => {
    console.log('All windows closed. Shutdown server') // eslint-disable-line 
    serverProcess.kill()
})