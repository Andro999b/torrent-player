const database = require('./database')

module.exports = function (file) {
    const torrentId = file._torrent.infoHash
    if (database.isTorrentFileCompleted(torrentId, file.path)) {
        return true
    }

    if (file.progress > 0.99) {
        database.setTorrentFileCompleted(torrentId, file.path)
        return true
    }

    return false
}