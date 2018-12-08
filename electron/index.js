const { app, BrowserWindow, globalShortcut } = require('electron')
const { fork } = require('child_process')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))

const fullscreen = argv['cast-screen'] || argv['fullscreen']
const noMpv = argv['no-mpv']
const debug = argv['debug']
const devTools = argv['dev-tools'] || debug
const webPort = argv['web-port'] || 8080

let serverProcess
let win

function appReady() {
    createMainWindow()

    if (debug) { 
        loadUI()
        return // server started outside
    }

    serverProcess = fork('./server/index.js', process.argv)
        .on('exit', (code, signal) => {
            console.error(`Server process exited. code: ${code}, signal: ${signal}`)
            process.exit()
        })
        .on('error', () => {
            console.error('Server process exited with error')
            process.exit(127)
        })
        .on('message', loadUI)
}

function getMPVPluginEntry() {
    const platform = process.platform
    const arch = process.arch
    
    const pluginPath = path.join(process.cwd(), 'plugins', `mpv-${platform}-${arch}`)

    console.log('MPV Plugin path:', pluginPath) // eslint-disable-line

    return `${pluginPath};application/x-mpvjs`
}

function createMainWindow() {
    win = new BrowserWindow({
        allowRunningInsecureContent: true,
        fullscreen,
        webPreferences: {
            additionalArguments: process.argv.slice(2),
            webSecurity: false,
            plugins: true,
            devTools
        },
        show: false,
        backgroundThrottling: false
    })

    win.loadFile(path.join(__dirname, 'loading.html'))

    !devTools && win.setMenu(null)

    win.on('ready-to-show', () => {
        !fullscreen && win.maximize()
        win.show()
    })

    globalShortcut.register('F11', () => {
        win.setFullScreen(!win.isFullScreen())
    })
}

function loadUI() {
    win.loadURL(`http://localhost:${debug ? 3000 : webPort}`)
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
    app.quit()
})