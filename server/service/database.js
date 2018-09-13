const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { ROOT_DIR } = require('../config')
const path = require('path')

const torrentDb = lowdb(new FileSync(path.join(ROOT_DIR, 'torrents.db.json')))

module.exports = {
    getTorrentFileCompleteStatus(torrentId, path) {
        return torrentDb.get([ torrentId, 'completedFiles', path ]) == true
    },
    setTorrentFileCompleted(torrentId, paths) {
        if (typeof paths === 'string') {
            paths = [paths]
        }

        var chain = torrentDb
        paths.forEach((path) =>
            chain = chain.set([ torrentId, 'completedFiles', path ] , true)
        )
        chain.write()
    },
    wipeTorrentData(torrentId) {
        torrentDb.unset(torrentId).write()
    }
}