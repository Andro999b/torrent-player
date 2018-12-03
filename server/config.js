const uuid = require('uuid')
const os = require('os')
const path = require('path')
const argv = require('minimist')(process.argv.slice(2))
const firstExistPath = require('./utils/firstExistPath')

const ROOT_DIR = firstExistPath([
    argv['root-dir'],
    path.join(os.homedir(), 'webtorrents')
])

module.exports = {
    VIDEO_ENCODER: argv['transcode-video-encoder'] || 'libx264',
    CLIENT_DIR: firstExistPath([
        path.join('client', 'dist'),
        path.join('..', 'client', 'dist'),
        path.join('client')
    ]),
    RESOURCES_DIR: firstExistPath([
        path.join('resources'),
        path.join('..', 'resources'),
    ]),
    TOOLS_DIR: firstExistPath([
        path.join('tools'),
        path.join('..', 'tools'),
    ]),
    DLNA_UUID: argv['dlna-uid'] || uuid(),
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
    TRANSCODING_ENABLED: argv['no-transcoding'] !== true,
    DNLA_ENABLED: argv['no-dnla'] !== true,
    DNLA_RENDERERS_ENABLED: argv['no-dnla-renderers'] !== true,
}