const path = require('path')
const { isAudio, isVideo, fileDirectory } = require('../../utils')
const { TRANSCODING_ENABLED, TORRENTS_DATA_DIR } = require('../../config')
const checkIfTorrentFileReady = require('./checkIfTorrentFileReady')
const database = require('./database')

function getTorrentFileContentLink(infoHash, fileIndex) {
    return `/api/torrents/${infoHash}/files/${fileIndex}`
}

function getTorrentFileBrowser(infoHash, fileIndex) {
    return `/api/torrents/${infoHash}/files/${fileIndex}/browserVideo`
}


function getTorrentFileHLSLink(infoHash, fileIndex) {
    return `/api/torrents/${infoHash}/files/${fileIndex}/hls`
}

function getTorrentTranscodedLink(infoHash, fileIndex) {
    return `/api/torrents/${infoHash}/files/${fileIndex}/transcoded`
}

function getTorrentHLSKeepAliveLink(infoHash, fileIndex) {
    return `/api/torrents/${infoHash}/files/${fileIndex}/hls/keepAlive`
}

module.exports = function(torrent) {
    const files = torrent.files
        .map((file, fileIndex) => { 
            if(!isAudio(file.name) && !isVideo(file.name)) return null

            const source = {
                id: fileIndex,
                name: file.name,
                path: fileDirectory(file.path),
                url: getTorrentFileContentLink(torrent.infoHash, fileIndex),
                browserUrl: getTorrentFileBrowser(torrent.infoHash, fileIndex),
                preferMpv: true
            }

            if(TRANSCODING_ENABLED) {
                source['manifestUrl'] = getTorrentFileHLSLink(torrent.infoHash, fileIndex)
                source['transcodedUrl'] = getTorrentTranscodedLink(torrent.infoHash, fileIndex)
                source['keepAliveUrl'] = getTorrentHLSKeepAliveLink(torrent.infoHash, fileIndex)
            }

            if(checkIfTorrentFileReady(file)) {
                source['fsPath'] = path.join(TORRENTS_DATA_DIR, file.path)
            }

            return source
        })
        .filter((f) => f != null)
        .sort((f1, f2) => f1.name.localeCompare(f2.name))
        .map((f, fileIndex) => {
            f.index = fileIndex
            return f
        })

    return {
        name: torrent.name,
        torrentInfoHash: torrent.infoHash,
        files,
        image: database.getImageCover(torrent.infoHash)
    }
}