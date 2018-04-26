const os = require('os')
const path = require('path')

module.exports = {
    DLNA_PORT: 5002,
    WEB_PORT: 8080,
    TRANSCODE_DIR: path.join(os.homedir(), 'webtorrents', 'transcode'),
    TORRENTS_DIR: path.join(os.homedir(), 'webtorrents'),
}