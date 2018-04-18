const WebTorrent = require('webtorrent')
const os = require('os')
const path = require('path')
const fs = require('fs')
const util = require('util')
const rimraf = util.promisify(require('rimraf'))
const pstats = util.promisify(fs.stat)
const punlink = util.promisify(fs.unlink)

const torrentClient = WebTorrent()
const torrentsDir = path.join(os.homedir(), 'webtorrents')

//restore torrents
const torrentsFolders = fs.readdirSync(torrentsDir)
torrentsFolders.forEach(file => {
    if (file.endsWith('torrent')) {
        const seedTorrentFile = path.join(torrentsDir, file)
        if (fs.statSync(seedTorrentFile).isFile()) {
            const seedTorrent = fs.readFileSync(seedTorrentFile)
            torrentClient.add(seedTorrent, { path: torrentsDir })
        }
    }
})

function torrentFileName(torrent) {
    return path.join(torrentsDir, torrent.infoHash + '.torrent')
}

module.exports = {
    addTorrent(magnetUri) {
        return new Promise((resolve, reject) => {
            torrentClient.add(magnetUri, { path: torrentsDir }, torrent => {
                const filePath = torrentFileName(torrent)
                fs.writeFile(filePath, torrent.torrentFile, (err) => {
                    if(err) {
                        console.error(`Fail to write torrent file ${filePath}`, err)
                        reject(err)
                    } else {
                        resolve(torrent)
                    }
                })
            })
        })
    },
    removeTorrent(torrentId, removeData = true) {
        const torrent = torrentClient.get(torrentId)
        if (torrent) {
            torrentClient.remove(torrentId)

            const seedTorrentFile = torrentFileName(torrent)
            const downloadName = path.join(torrentsDir, torrent.name)

            const operations = [
                punlink(seedTorrentFile)
            ]

            //remove downloader data
            if (removeData) {
                operations.push(
                    pstats(downloadName)
                        .then(stats => {
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
        return torrentClient.get(torrentId)
    },
    getTorrents() {
        return torrentClient.torrents
    }
}