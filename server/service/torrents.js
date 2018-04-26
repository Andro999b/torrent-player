const WebTorrent = require('webtorrent')
const path = require('path')
const fs = require('fs')
const util = require('util')
const rimraf = util.promisify(require('rimraf'))
const pstats = util.promisify(fs.stat)
const punlink = util.promisify(fs.unlink)
const { stopTranscoding } = require('./transcode')
const { TRANSCODE_DIR, TORRENTS_DIR } = require('../config')
const debug = require('debug')('torrents')

const torrentClient = WebTorrent()

function torrentFileName(torrent) {
    return path.join(TORRENTS_DIR, torrent.infoHash + '.torrent')
}

module.exports = {
    restoreTorrents() {
        //restore torrents
        const torrentsFolders = fs.readdirSync(TORRENTS_DIR)
        torrentsFolders.forEach(file => {
            if (file.endsWith('torrent')) {
                const seedTorrentFile = path.join(TORRENTS_DIR, file)
                if (fs.statSync(seedTorrentFile).isFile()) {
                    const seedTorrent = fs.readFileSync(seedTorrentFile)
                    torrentClient.add(seedTorrent, { path: TORRENTS_DIR })
                    debug(`Torrent resumed: ${seedTorrentFile}`)
                }
            }
        })
    },
    addTorrent(magnetUri) {
        return new Promise((resolve, reject) => {
            try {
                const tid = setTimeout(() => reject('timedout'), 10000)//give 10 sec to init magnet uri and then fail
                torrentClient.add(magnetUri, { path: TORRENTS_DIR }, torrent => {
                    clearTimeout(tid)
                    const filePath = torrentFileName(torrent)
                    fs.writeFile(filePath, torrent.torrentFile, (err) => {
                        if (err) {
                            console.error(`Fail to write torrent file ${filePath}`, err)
                            reject(err)
                        } else {
                            resolve(torrent)
                        }
                    })
                })
            } catch (e) {
                debug(`magnetUri: ${magnetUri} information reading timedout`, e)
                reject(e)
            }
        })
    },
    removeTorrent(torrentId, removeData = true) {
        const torrent = torrentClient.get(torrentId)
        if (torrent) {
            torrentClient.remove(torrentId)

            const seedTorrentFile = torrentFileName(torrent)
            const downloadName = path.join(TORRENTS_DIR, torrent.name)
            const transcodeName = path.join(TRANSCODE_DIR, torrent.name)

            const operations = [
                punlink(seedTorrentFile)
            ]

            //remove downloader data
            if (removeData) {
                stopTranscoding(torrent)
                operations.push(
                    pstats(downloadName)
                        .then(stats => {
                            if (stats.isDirectory())
                                return rimraf(downloadName)
                            else
                                return punlink(downloadName)
                        })
                )
                operations.push(
                    pstats(transcodeName)
                        .then(stats => {
                            if (stats.isDirectory())
                                return rimraf(transcodeName)
                            else
                                return punlink(transcodeName)
                        })
                )
            }

            return Promise.all(operations)
        }
        return Promise.resolve()
    },
    getTorrent(torrentId) {
        return torrentClient.get(torrentId)
    },
    getTorrents() {
        return torrentClient.torrents
    }
}