const os = require('os')
const path = require('path')

module.exports = {
    DLNA_PORT: 5004,
    WEB_PORT: 8080,
    TRANSCODER_IDLE_TIMEOUT: 60 * 1000,
    HLS_FRAGMENT_DURATION: 10,
    /*
        timeout 5 times longer that time needted to play 1 fragment. 
        if during this time client not request any fragment we can pause transcoding
     */
    HLS_TRANSCODER_IDLE_TIMEOUT: 10 * 1000 * 5,
    ROOT_DIR: path.join(os.homedir(), 'webtorrents'),
    HLS_DIRECTORY: path.join(os.homedir(), 'webtorrents', 'hls'),
    TORRENTS_DIR: path.join(os.homedir(), 'webtorrents', 'torrents'),
    TORRENTS_DATA_DIR: path.join(os.homedir(), 'webtorrents', 'data'),
}