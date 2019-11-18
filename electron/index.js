const { app, BrowserWindow } = require('electron')
const { fork } = require('child_process')

const path = require('path')
const os = require('os')
const argv = require('minimist')(process.argv)

const fullscreen = argv['fullscreen'] || argv['castscreen']
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

    startServer()
}

function startServer() {
    const isPackaged = process.mainModule.filename.indexOf('app.asar') !== -1
    let rootPath = process.cwd()

    if(isPackaged) {
        rootPath = path.resolve(__dirname, '..', '..', '..')
    }

    serverProcess = fork(path.join(rootPath, 'server', 'index.js'), process.argv)
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

    const pluginPath = path.join(process.cwd(), 'plugins', `mpv-${platform}-${arch}.node`)

    console.log('MPV Plugin path:', pluginPath) // eslint-disable-line

    return `${pluginPath};application/x-mpvjs`
}

function createMainWindow() {
    win = new BrowserWindow({
        allowRunningInsecureContent: true,
        fullscreen,
        webPreferences: {
            additionalArguments: process.argv,
            webSecurity: false,
            plugins: true,
            nodeIntegration: true,
            devTools
        },
        show: false,
        backgroundThrottling: false,
        icon: path.join(__dirname, 'icon.png')
    })

    win.loadFile(path.join(__dirname, 'loading.html'))

    !devTools && win.setMenu(null)

    win.on('ready-to-show', () => {
        // !fullscreen && win.maximize()
        win.show()

        //add shortcuts
        win.webContents.on('before-input-event',  (e, { code, shift, control, alt}) => {
            if(!(shift && control && alt)) {
                switch(code) {
                    case 'F5': {
                        win.reload()
                        e.preventDefault()
                        break
                    }
                    case 'F11': {
                        win.setFullScreen(!win.isFullScreen())
                        e.preventDefault()
                        break
                    }
                }
            }
        })
    })
}

function loadUI() {
    win.loadURL(`http://localhost:${debug ? 3000 : webPort}`)
}

// set user data path for electon
const ROOT_DIR = argv['root-dir'] || path.join(os.homedir(), 'webtorrents')
app.setPath('userData', path.join(ROOT_DIR, 'electron'))

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

process.on('uncaughtException', function (err) {
    console.log(err) // eslint-disable-line no-console
})