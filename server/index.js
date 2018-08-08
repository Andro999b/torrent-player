const dlna = require('./dlna')
const torrentsService = require('./service/torrents')
const web = require('./web')
const fs = require('fs-extra')
const os = require('os')
const Ffmpeg = require('fluent-ffmpeg')
const {
    TORRENTS_DATA_DIR,
    TORRENTS_DIR,
    HLS_DIRECTORY
} = require('./config')

//init tools path
const platformExt = os.platform() == 'win32' ? '.exe' : ''
const ffmpegPath = `../tools/${os.platform()}-${os.arch()}-ffmpeg${platformExt}`
const ffprobePath = `../tools/${os.platform()}-${os.arch()}-ffprobe${platformExt}`

if(fs.existsSync(ffmpegPath)) Ffmpeg.setFfmpegPath(ffmpegPath)
if(fs.existsSync(ffprobePath)) Ffmpeg.setFfprobePath(ffprobePath)

//ensure directories
fs.ensureDirSync(TORRENTS_DIR)
fs.ensureDirSync(TORRENTS_DATA_DIR)
fs.ensureDirSync(HLS_DIRECTORY)

//start services
torrentsService.restoreTorrents()
web()
dlna()

process.on('uncaughtException', (e) => console.error(e))