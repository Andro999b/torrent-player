const defaultArgc = {
    'dlna': true,
    'dlna-renderers': true,
    'transcoding': true
}

const uuid = require('uuid')
const os = require('os')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2), { default: defaultArgc })
const firstExistPath = require('./utils/firstExistPath')

const ROOT_DIR = argv['root-dir'] || path.join(os.homedir(), 'webtorrents')
const CLIENT_DIR = firstExistPath([
    path.join(__dirname, 'client', 'dist'),
    path.join(__dirname, '..', 'client', 'dist'),
    path.join(__dirname, '..', 'client')
])

const RESOURCES_DIR = firstExistPath([
    path.join(__dirname, 'resources'),
    path.join(__dirname, '..', 'resources'),
])

const TOOLS_DIR = !argv['system-ffmpeg'] && firstExistPath([
    path.join(__dirname, 'tools'),
    path.join(__dirname, '..', 'tools'),
])

/* eslint-disable */
console.log('Config root directory: ', ROOT_DIR)
console.log('Resources directory: ', RESOURCES_DIR)
console.log('UI directory: ', CLIENT_DIR)
console.log('Tools root directory: ', TOOLS_DIR)
/* eslint-enable */

module.exports = {
    VIDEO_ENCODER: argv['transcode-video-encoder'] || 'libx264',
    CLIENT_DIR,
    RESOURCES_DIR,
    TOOLS_DIR,
    DLNA_UUID: argv['dlna-uid'] || uuid(),
    DLNA_NAME: argv['dlna-name'] || 'Torrents',
    DLNA_PORT: argv['dlna-port'] || 5004,
    WEB_PORT: argv['web-port'] || 8080,
    TRANSCODER_IDLE_TIMEOUT: 60 * 1000,
    HLS_FRAGMENT_DURATION: 10,
    /*
        timeout 2 times longer that time needted to play 1 fragment.
        if during this time client not request any fragment we can pause transcoding
    */
    HLS_TRANSCODER_IDLE_TIMEOUT: 10 * 1000 * 2,
    ROOT_DIR,
    HLS_DIRECTORY: path.join(ROOT_DIR, 'hls'),
    TORRENTS_DIR: path.join(ROOT_DIR, 'torrents'),
    TORRENTS_DATA_DIR: path.join(ROOT_DIR, 'data'),
    TRANSCODER_COPY_CODECS: {
        audio: ['acc', 'mp3'],
        video: ['h264'],
    },
    TRANSCODING_ENABLED: argv['transcoding'],
    DLNA_ENABLED: argv['dlna'],
    DLNA_RENDERERS_ENABLED: argv['dlna-renderers'],
    PROXY_HEADERS: ['Content-Type', 'Content-Length', 'Cache-Control', 'ETag', 'Expires', 'Date', 'Last-Modified']
}