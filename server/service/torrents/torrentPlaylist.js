const mimeLookup = require('mime-types').lookup
const { isAudio, isVideo, fileDirectory } = require('../../utils')

function getTorrentFileContentLink(infoHash, fileIndex) {
    return `/api/torrents/${infoHash}/files/${fileIndex}`
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
        .filter((file) => isAudio(file.name) || isVideo(file.name))
        .map((file, fileIndex) => ({
            index: fileIndex,
            id: file.id,
            name: file.name,
            path: fileDirectory(file.path),
            mimeType: mimeLookup(file.name),
            url: getTorrentFileContentLink(torrent.infoHash, fileIndex),
            hlsUrl: getTorrentFileHLSLink(torrent.infoHash, fileIndex),
            transcodedUrl: getTorrentTranscodedLink(torrent.infoHash, fileIndex),
            keepAliveUrl: getTorrentHLSKeepAliveLink(torrent.infoHash, fileIndex)
        }))

    return {
        name: torrent.name,
        files
    }
}