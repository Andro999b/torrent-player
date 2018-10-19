const WebTorrent = require('webtorrent')
const path = require('path')
const fs = require('fs-extra')
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const parseTorrent = require('parse-torrent')
const superagent = require('superagent')
const database = require('../database')
const { stopTranscoding } = require('../transcode')
const { TORRENTS_DIR, TORRENTS_DATA_DIR } = require('../../config')
const debug = require('debug')('torrents')

const torrentClient = new WebTorrent()

function addTorrent() {
    return new Promise((resolve, reject) => {
        try{
            torrentClient.add.apply(torrentClient, [...arguments, resolve])
        } catch(e) {
            reject(e)
        }
    })
}

function torrentFileName(torrent) {
    return path.join(TORRENTS_DIR, torrent.infoHash + '.torrent')
}

function deselectAll(torrent) {
    torrent.deselect(0, torrent.pieces.length - 1)
}

function waitCompletion(torrent) {
    torrent.once('done', () => {
        const paths = torrent.files
            .filter((file) => file.progress > 0.99)
            .map((file) => file.path)
        database.setTorrentFileCompleted(torrent.infoHash, paths)
    })
}

module.exports = {
    restoreTorrents() {
        //restore torrents
        const torrentsFolders = fs.readdirSync(TORRENTS_DIR)
        torrentsFolders.forEach((file) => {
            if (file.endsWith('torrent')) {
                const seedTorrentFile = path.join(TORRENTS_DIR, file)
                if (fs.statSync(seedTorrentFile).isFile()) {
                    const seedTorrent = fs.readFileSync(seedTorrentFile)
                    torrentClient.add(seedTorrent, { path: TORRENTS_DATA_DIR }, (torrent) => {
                        debug(`${torrent.name} verified`)
                        deselectAll(torrent)
                        waitCompletion(torrent)
                    })
                    debug(`Torrent resumed: ${seedTorrentFile}`)
                }
            }
        })
    },
    async addTorrent(magnetUrl, torrentUrl) {
        let parsedTorrent = null
        
        if(torrentUrl) {
            const res = await superagent
                .get(torrentUrl)
                .buffer(true).parse(superagent.parse.image)
            parsedTorrent = parseTorrent(res.body)
        } else if (magnetUrl) {
            parsedTorrent = parseTorrent(magnetUrl)
        }

        let torrent = torrentClient.get(parsedTorrent.infoHash)

        if(torrent) return torrent

        torrent = await addTorrent(parsedTorrent, { path: TORRENTS_DATA_DIR })

        deselectAll(torrent)
        waitCompletion(torrent)

        await fs.writeFile(torrentFileName(torrent), torrent.torrentFile)

        return torrent
    },
    async removeTorrent(torrentId, removeData = true) {
        const torrent = torrentClient.get(torrentId)

        if (!torrent) return

        torrentClient.remove(torrentId)
        database.wipeTorrentData(torrentId)

        await fs.unlink(torrentFileName(torrent))

        //remove downloader data
        if (removeData) {
            stopTranscoding(torrent)

            const downloadName = path.join(TORRENTS_DATA_DIR, torrent.name)
            if (await fs.exists(downloadName)) {
                if((await fs.stat(downloadName)).isDirectory())
                    await rimraf(downloadName)
                else
                    await fs.unlink(downloadName)
            }
        }
    },
    getTorrent(torrentId) {
        return torrentClient.get(torrentId)
    },
    getTorrents() {
        return torrentClient.torrents
    }
}