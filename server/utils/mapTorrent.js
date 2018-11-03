const { pick } = require('lodash')
const { fileDirectory } = require('.')

module.exports = (torrent) => {
    const filteredTorrent = pick(torrent, [
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
        'files',
        'downloadInBackground'
    ])

    const filtredFiles = filteredTorrent.files
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

    filteredTorrent.files = filtredFiles
        .sort((f1, f2) => f1.name.localeCompare(f2.name))

    return filteredTorrent
}