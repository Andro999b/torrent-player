const fs = require('fs-extra')
const {
    TORRENTS_DATA_DIR,
    TORRENTS_DIR,
    HLS_DIRECTORY
} = require('./config')

//ensure directories
fs.ensureDirSync(TORRENTS_DIR)
fs.ensureDirSync(TORRENTS_DATA_DIR)
fs.ensureDirSync(HLS_DIRECTORY)


const dlna = require('./dlna')
// const dlnaRenderers = require('./dlna/renderers')
const torrentsService = require('./service/torrents')
const web = require('./web')
const os = require('os')
const Ffmpeg = require('fluent-ffmpeg')

//init tools path
const platformExt = os.platform() == 'win32' ? '.exe' : ''
const ffmpegPath = `../tools/${os.platform()}-${os.arch()}-ffmpeg${platformExt}`
const ffprobePath = `../tools/${os.platform()}-${os.arch()}-ffprobe${platformExt}`

if(fs.existsSync(ffmpegPath)) Ffmpeg.setFfmpegPath(ffmpegPath)
if(fs.existsSync(ffprobePath)) Ffmpeg.setFfprobePath(ffprobePath)



//start services
torrentsService.restoreTorrents()
web()
dlna()
// dlnaRenderers()

process.on('uncaughtException', (e) => console.error(e))
