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
        .map((file, fileIndex) => { 
            if(!isAudio(file.name) && !isVideo(file.name)) return null

            return {
                id: fileIndex,
                name: file.name,
                path: fileDirectory(file.path),
                mimeType: mimeLookup(file.name),
                url: getTorrentFileContentLink(torrent.infoHash, fileIndex),
                hlsUrl: getTorrentFileHLSLink(torrent.infoHash, fileIndex),
                transcodedUrl: getTorrentTranscodedLink(torrent.infoHash, fileIndex),
                keepAliveUrl: getTorrentHLSKeepAliveLink(torrent.infoHash, fileIndex)
            }
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
        files
    }
}