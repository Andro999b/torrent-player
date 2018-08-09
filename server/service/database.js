const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { ROOT_DIR } = require('../config')
const path = require('path')

const db = lowdb(new FileSync(path.join(ROOT_DIR, 'db.json')))

module.exports = {
    getTorrentFileCompleteStatus(torrentId, path) {
        return db.get([ torrentId, 'completedFiles', path ])
    },
    setTorrentFileCompleted(torrentId, paths) {
        if (paths instanceof String) {
            paths = [paths]
        }

        var chain = db
        paths.forEach((path) =>
            chain = chain.set([ torrentId, 'completedFiles', path ] , true)
        )
        chain.write()
    },
    wipeTorrentData(torrentId) {
        db.unset(torrentId)
    }
}