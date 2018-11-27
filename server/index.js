const fs = require('fs-extra')
const path = require('path')
const {
    TORRENTS_DATA_DIR,
    TORRENTS_DIR,
    TOOLS_DIR,
    HLS_DIRECTORY,
    DNLA_ENABLED,
    DNLA_RENDERERS_ENABLED
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

    if(fs.existsSync(ffmpegPath)) Ffmpeg.setFfmpegPath(ffmpegPath)
    if(fs.existsSync(ffprobePath)) Ffmpeg.setFfprobePath(ffprobePath)
}

//start services
torrentsService.restoreTorrents()
web()

if(DNLA_ENABLED) {
    dlna()
    DNLA_RENDERERS_ENABLED && dlnaRenderers()
}

process.on('uncaughtException', (e) => console.error(e))
process.on('SIGPIPE', () => { /* noop for electron */ })

process.send && process.send('ready')
