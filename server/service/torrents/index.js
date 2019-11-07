const WebTorrent = require('webtorrent')
const path = require('path')
const fs = require('fs-extra')
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const parseTorrent = require('parse-torrent')
const superagent = require('superagent')

const database = require('./database')

const { TORRENTS_DIR, TORRENTS_DATA_DIR } = require('../../config')
const debug = require('debug')('torrents')

const transcode = require('../transcode')
const trackers = require('../trackers')
const bookmarks =  require('../bookmarks')
const remote =  require('../remote')

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

function setTorrentDownloadStatus(torrent, download) {
    if(download) {
        torrent.select(0, torrent.pieces.length - 1)
    } else {
        torrent.deselect(0, torrent.pieces.length - 1)
    }
}

function attachCompleteHandler(torrent) {
    torrent.once('done', () => checkFilesStatus(torrent))
}

function checkFilesStatus(torrent) {
    let paths

    if(torrent.downloaded == torrent.length) {
        paths = torrent.files.map((file) => file.path)
    } else {
        paths = torrent.files
            .filter((file) => file.progress > 0.99)
            .map((file) => file.path)
    }

    database.setTorrentFileCompleted(torrent.infoHash, paths)
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
                    torrentClient.add(
                        seedTorrent, 
                        { path: TORRENTS_DATA_DIR }, 
                        (torrent) => {
                            debug(`${torrent.name} verified`)
                            const autoDownload = database.isEnabledDownloadInBackground(torrent.infoHash)
                            setTorrentDownloadStatus(torrent, autoDownload)
                            attachCompleteHandler(torrent)
                        }
                    )
                    debug(`Torrent resumed: ${seedTorrentFile}`)
                }
            }
        })
    },
    async addTorrent({ magnetUrl, torrentUrl, provider, image }) {
        let parsedTorrent = null
        
        if(torrentUrl) {
            try{
                if(provider) {
                    parsedTorrent = await trackers.loadTorentFile(provider, torrentUrl)
                } else {
                    const res = await superagent
                        .get(torrentUrl)
                        .buffer(true)
                        .parse(superagent.parse['application/octet-stream'])
                        
                    parsedTorrent = parseTorrent(res.body)
                }
            } catch(e) {
                console.warn(`Fail to load torrent file: ${e}`)
            }
        } 
        
        if (!parsedTorrent && magnetUrl) {
            parsedTorrent = parseTorrent(magnetUrl)
        } 
        
        if (!parsedTorrent) {
            throw new Error('No suitable torrent file source')
        }

        let torrent = torrentClient.get(parsedTorrent.infoHash)

        if(torrent) return torrent // already downloading

        torrent = await addTorrent(parsedTorrent, { path: TORRENTS_DATA_DIR })

        setTorrentDownloadStatus(torrent)
        attachCompleteHandler(torrent)

        database.setImageCover(parsedTorrent.infoHash, image)
        await fs.writeFile(torrentFileName(torrent), torrent.torrentFile)

        return torrent
    },
    async removeTorrent(torrentId, removeData = true) {
        const torrent = torrentClient.get(torrentId)

        if (!torrent) return

        // cleanup torrent databases
        torrentClient.remove(torrentId)
        remote.stopPlayTorrent(torrentId)
        database.wipeTorrentData(torrentId)
        
        await bookmarks.removeByTorrentInfoHash(torrentId)
        await fs.unlink(torrentFileName(torrent))

        //remove downloader data
        if (removeData) {
            transcode.stopTranscoding(torrent)

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
        const torrent = torrentClient.get(torrentId)
        if(torrent) {
            torrent.downloadInBackground = database.isEnabledDownloadInBackground(torrentId)
            torrent.image = database.getImageCover(torrentId)
        }

        return torrent
    },
    getTorrents() {
        return torrentClient
            .torrents
            .map((torrent) => {
                torrent.downloadInBackground = database.isEnabledDownloadInBackground(torrent.infoHash)
                torrent.image = database.getImageCover(torrent.infoHash)

                return torrent
            })
    },
    setTorrentBackgroundDownload(torrentId, enabled) {
        const torrent = torrentClient.get(torrentId)
        if(torrent) {
            setTorrentDownloadStatus(torrent, enabled)
            database.setDownLoadInBackgroundStatus(torrent.infoHash, enabled)
        }
    }
}