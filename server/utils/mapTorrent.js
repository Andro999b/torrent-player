const { pick } = require('lodash')
const { fileDirectory } = require('.')

module.exports = (torrent, addFiles) => {
    const filteredTorrent = pick(torrent, [
        'infoHash',
        'name',
        'timeRemaining',
        'received',
        'length',
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

    if(addFiles) {
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
    } else {
        delete filteredTorrent.files
    }

    return filteredTorrent
}

module.exports.progress = (torrent) => 
    pick(torrent, [
        'received',
        'downloaded',
        'length',
        'uploaded',
        'downloadSpeed',
        'uploadSpeed',
        'ratio',
        'numPeers'
    ])
