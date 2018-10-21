const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { ROOT_DIR } = require('../../config')
const path = require('path')

const torrentDb = lowdb(new FileSync(path.join(ROOT_DIR, 'torrents.db.json')))

module.exports = {
    getTorrentFileCompleteStatus(torrentId, path) {
        return torrentDb.get([ torrentId, path, 'complete' ]) == true
    },
    getTorrentFileMetadata(torrentId, path) {
        return torrentDb.get([ torrentId, path, 'metadata' ]).value()
    },
    setTorrentFileCompleted(torrentId, paths) {
        if(!torrentId || !path) throw Error('torrentId or path is null')

        if (typeof paths === 'string') {
            paths = [paths]
        }

        var chain = torrentDb
        paths.forEach((path) =>
            chain = chain.set([ torrentId, path, 'complete' ] , true)
        )
        chain.write()
    },
    storeTorrentFileMetadata(torrentId, path, metadata) {
        if(!torrentId || !path) throw Error('torrentId or path is null')

        return torrentDb.set([ torrentId, path, 'metadata' ], metadata).write()
    },
    wipeTorrentData(torrentId) {
        torrentDb.unset(torrentId).write()
    }
}