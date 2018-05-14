const os = require('os')
const path = require('path')

module.exports = {
    DLNA_PORT: 5004,
    WEB_PORT: 8080,
    TORRENTS_DIR: path.join(os.homedir(), 'webtorrents'),
}