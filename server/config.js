const os = require('os')
const path = require('path')
const firstExistPath = require('./utils/firstExistPath')

module.exports = {
    VIDEO_ENCODER: 'libx264',
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
    DLNA_PORT: 5004,
    WEB_PORT: 8080,
    TRANSCODER_IDLE_TIMEOUT: 60 * 1000,
    HLS_FRAGMENT_DURATION: 10,
    /*
        timeout 2 times longer that time needted to play 1 fragment. 
        if during this time client not request any fragment we can pause transcoding
     */
    HLS_TRANSCODER_IDLE_TIMEOUT: 10 * 1000 * 2,
    ROOT_DIR: path.join(os.homedir(), 'webtorrents'),
    HLS_DIRECTORY: path.join(os.homedir(), 'webtorrents', 'hls'),
    TORRENTS_DIR: path.join(os.homedir(), 'webtorrents', 'torrents'),
    TORRENTS_DATA_DIR: path.join(os.homedir(), 'webtorrents', 'data'),
    TRANSCODER_COPY_CODECS: {
        audio: ['acc', 'mp3'],
        video: ['h264'],
    }
}