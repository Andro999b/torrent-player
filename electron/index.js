const { app, BrowserWindow, globalShortcut } = require('electron')
const { fork } = require('child_process')
const path = require('path')

const appArgs = process.argv
const fullscreen = appArgs.indexOf('--cast-screen') != -1 || appArgs.indexOf('--fullscreen') != -1
const noMpv = appArgs.indexOf('--no-mpv') != -1
const debug = appArgs.indexOf('--debug') != -1
const devTools = appArgs.indexOf('--dev-tools') != -1 || debug

let serverProcess

function appReady() {
    if (debug) {
        createMainWindow()
        return
    }

    serverProcess = fork('./server/index.js', appArgs)
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

function getMPVPluginEntry() {
    const platform = process.platform
    const arch = process.arch
    
    const pluginDir = path.join(__dirname, 'plugins', 'mpv')
    const fullPluginPath = path.join(pluginDir, `${platform}-${arch}`)
    
    let pluginPath = path.relative(process.cwd(), fullPluginPath)

    return `${pluginPath};application/x-mpvjs`
}

function createMainWindow() {
    const win = new BrowserWindow({
        allowRunningInsecureContent: true,
        fullscreen,
        webPreferences: {
            additionalArguments: appArgs.slice(2),
            webSecurity: false,
            plugins: true,
            devTools
        },
        show: false,
        backgroundThrottling: false,
    })

    !devTools && win.setMenu(null)

    win.loadURL(`http://localhost:${debug ? 3000 : 8080}`)
    win.on('ready-to-show', () => {
        !fullscreen && win.maximize()
        win.show()
    })

    globalShortcut.register('F11', () => {
        win.setFullScreen(!win.isFullScreen())
    })
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

if(!noMpv) {
    app.commandLine.appendSwitch('ignore-gpu-blacklist')
    app.commandLine.appendSwitch('register-pepper-plugins', getMPVPluginEntry())
}

app.on('ready', appReady)
app.on('window-all-closed', () => {
    console.log('All windows closed. Shutdown server') // eslint-disable-line 
    serverProcess && serverProcess.kill()
})