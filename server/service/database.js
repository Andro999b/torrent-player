const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { ROOT_DIR } = require('../config')
const path = require('path')

const db = lowdb(FileSync(path.join(ROOT_DIR, 'db.json')))

module.exports = {
    getTorrentFileCompleteStatus(torrentId, path) {
        return db.get(`${torrentId}.completedFiles.${path}`)
    },
    setTorrentFileCompleted(torrentId, paths) {
        if (paths instanceof String) {
            paths = [paths]
        }

        paths.forEach((path) =>
            db.set(`${torrentId}.completedFiles.${path}`, true)
        )
        db.write()
    },
    wipeTorrentData(torrentId) {
        db.unset(torrentId)
    }
}