const fs = require('fs-extra')
const path = require('path')
const {
    TORRENTS_DATA_DIR,
    TORRENTS_DIR,
    TOOLS_DIR,
    HLS_DIRECTORY,
    DLNA_ENABLED,
    DLNA_RENDERERS_ENABLED
} = require('./config')

//ensure directories
fs.ensureDirSync(TORRENTS_DIR)
fs.ensureDirSync(TORRENTS_DATA_DIR)
fs.ensureDirSync(HLS_DIRECTORY)

const dlna = require('./dlna')
const dlnaRenderers = require('./dlna/renderers')
const torrentsService = require('./service/torrents')
const web = require('./web')
const os = require('os')
const Ffmpeg = require('fluent-ffmpeg')

//init tools path
if(TOOLS_DIR) {
    const platformExt = os.platform() == 'win32' ? '.exe' : ''
    const ffmpegPath = path.join(TOOLS_DIR, `${os.platform()}-${os.arch()}-ffmpeg${platformExt}`)
    const ffprobePath = path.join(TOOLS_DIR, `${os.platform()}-${os.arch()}-ffprobe${platformExt}`)

    if(fs.existsSync(ffmpegPath)) {
        Ffmpeg.setFfmpegPath(ffmpegPath)
    } else {
        console.log('No internal ffmpeg found. Using system.') // eslint-disable-line no-console
    }
    if(fs.existsSync(ffprobePath)) {
        Ffmpeg.setFfprobePath(ffprobePath)
    } else {
        console.log('No internal ffprob found. Using system.') // eslint-disable-line no-console
    }
} else {
    console.log('No internal ffmpeg and ffprob found. Using system.') // eslint-disable-line no-console
}

//start services
torrentsService.restoreTorrents()
web()

if(DLNA_ENABLED) {
    const { ssdpServer } = dlna()
    DLNA_RENDERERS_ENABLED && dlnaRenderers(ssdpServer)
}

process.on('uncaughtException', (e) => console.error(e))
process.on('SIGPIPE', () => { /* noop for electron */ })

process.send && process.send('ready')
