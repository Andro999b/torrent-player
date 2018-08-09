const WebTorrent = require('webtorrent')
const path = require('path')
const fs = require('fs-extra')
const { promisify } = require('util')
const rimraf = promisify(require('rimraf'))
const pstats = promisify(fs.stat)
const punlink = promisify(fs.unlink)
const request = require('superagent')
const { pick } = require('lodash')
const mimeLookup = require('mime-types').lookup
const database = require('./database')
const { stopTranscoding } = require('./transcode')
const { TORRENTS_DIR, TORRENTS_DATA_DIR } = require('../config')
const debug = require('debug')('torrents')


const torrentClient = WebTorrent()

function torrentFileName(torrent) {
    return path.join(TORRENTS_DIR, torrent.infoHash + '.torrent')
}

function deselectAll(torrent) {
    torrent.deselect(0, torrent.pieces.length - 1)
}

function waitCompletion(torrent) {
    torrent.once('done', () => {
        const paths = torrent.files.map((file) => file.path)
        database.setTorrentFileCompleted(torrent.infoHash, paths)
    })
}

function mapTorrent(torrent) {
    const filterdTorrent = pick(torrent, [
        'infoHash',
        'name',
        'timeRemaining',
        'received',
        'downloaded',
        'uploaded',
        'downloadSpeed',
        'uploadSpeed',
        'ratio',
        'numPeers',
        'path',
        'files'
    ])

    const filtredFiles = filterdTorrent.files
        .map((file) => pick(file, [
            'name',
            'path',
            'length',
            'downloaded',
            'progress'
        ]))

    filtredFiles.forEach((file) => {
        file.mimeType = mimeLookup(file.name)
    })

    filterdTorrent.files = filtredFiles

    return filterdTorrent
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
    addTorrent(magnetUrl, torrentUrl) {
        return new Promise((resolve, reject) => {
            const storeTorrent = (torrent) => {
                deselectAll(torrent)
                waitCompletion(torrent)

                const filePath = torrentFileName(torrent)
                fs.writeFile(filePath, torrent.torrentFile, (err) => {
                    if (err) {
                        console.error(`Fail to write torrent file ${filePath}`, err)
                        reject(err)
                    } else {
                        resolve(torrent)
                    }
                })
            }


            if (torrentUrl) {
                request
                    .get(torrentUrl)
                    .buffer()
                    .parse(request.parse['application/octet-stream'])
                    .then((res) => {
                        torrentClient.add(res.body, { path: TORRENTS_DATA_DIR }, storeTorrent)
                    })
                    .catch((e) => {
                        debug(`torrentUrl: ${torrentUrl} fail fetch torrent`, e)
                        reject(e)
                    })
            } else {
                try {
                    const tid = setTimeout(() => reject('timedout'), 10000)//give 10 sec to init magnet uri and then fail
                    torrentClient.add(magnetUrl, { path: TORRENTS_DATA_DIR }, (torrent) => {
                        clearTimeout(tid)
                        storeTorrent(torrent)
                    })
                } catch (e) {
                    debug(`${magnetUrl} information reading error`, e)
                    reject(e)
                }
            }

        }).then((torrent) => mapTorrent(torrent))
    },
    removeTorrent(torrentId, removeData = true) {
        const torrent = torrentClient.get(torrentId)
        if (torrent) {
            torrentClient.remove(torrentId)
            database.wipeTorrentData(torrentId)

            const seedTorrentFile = torrentFileName(torrent)
            const downloadName = path.join(TORRENTS_DATA_DIR, torrent.name)

            const operations = [
                punlink(seedTorrentFile)
            ]

            //remove downloader data
            if (removeData) {
                stopTranscoding(torrent)
                operations.push(
                    pstats(downloadName)
                        .then((stats) => {
                            if (stats.isDirectory())
                                return rimraf(downloadName)
                            else
                                return punlink(downloadName)
                        })
                )
            }

            return Promise.all(operations)
        }
        return Promise.resolve()
    },
    getTorrent(torrentId) {
        const torrent = torrentClient.get(torrentId)
        return torrent ? mapTorrent(torrent) : null
    },
    getTorrents() {
        return torrentClient.torrents.map(mapTorrent)
    },
    checkIfTorrentFileReady(file) {
        const torrentId = file._torrent.infoHash
        if (database.getTorrentFileCompleteStatus(torrentId, file.path)) {
            return true
        }

        if (file.progress > 0.99) {
            database.setTorrentFileCompleted(torrentId, file.path)
            return true
        }

        return false
    }
}