const { pick } = require('lodash')
const { fileDirectory } = require('.')

module.exports = (torrent) => {
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
        
    filtredFiles.forEach((file, fileIndex) => {
        file.id = fileIndex
        file.path = fileDirectory(file.path)
        file.torrentInfoHash = torrent.infoHash
    })

    filterdTorrent.files = filtredFiles
        .sort((f1, f2) => f1.name.localeCompare(f2.name))

    return filterdTorrent
}