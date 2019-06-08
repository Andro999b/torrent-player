const lowdb = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { ROOT_DIR } = require('../../config')
const path = require('path')

class Database {
    constructor() {
        this.torrentDb = lowdb(new FileSync(path.join(ROOT_DIR, 'torrents.db.json')))
    }

    setImageCover(torrentId, image) {
        this.torrentDb.set([ torrentId, 'image' ], image).write()
    }

    getImageCover(torrentId) {
        return this.torrentDb.get([ torrentId, 'image' ])
    }

    setDownLoadInBackgroundStatus(torrentId, status) {
        if(!torrentId) throw Error('torrentId')

        this.torrentDb.set([ torrentId, 'bownloadInBackground' ], status).write()
    }

    setTorrentFileCompleted(torrentId, paths) {
        if(!torrentId || !path) throw Error('torrentId or path is null')

        if (typeof paths === 'string') {
            paths = [paths]
        }

        var chain = this.torrentDb
        paths.forEach((path) =>
            chain = chain.set([ torrentId, path, 'complete' ] , true)
        )
        chain.write()
    }

    isTorrentFileCompleted(torrentId, path) {
        return this.torrentDb.get([ torrentId, path, 'complete' ]) == true
    }

    getTorrentFileDuration(torrentId, path) {
        return this.torrentDb.get([ torrentId, path, 'duration' ]).value()
    }

    setTorrentFileDuration(torrentId, path, duration) {
        if(!torrentId || !path) throw Error('torrentId or path is null')

        const key = [ torrentId, path, 'duration' ]
        if(this.torrentDb.has(key))
            return

        this.torrentDb.set(key, duration).write()
    }
    
    wipeTorrentData(torrentId) {
        this.torrentDb.unset(torrentId).write()
    }
}

module.exports = new Database()