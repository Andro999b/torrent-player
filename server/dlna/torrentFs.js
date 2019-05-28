const cache = {}

class TorrentFs {
    constructor(infoHash) {
        this.infoHash = infoHash
        this.maxId = 0
        this.root = { id: 0, children: [] }
        this.flatTree = {
            '0': this.root
        }
    }

    addFile(file, fileIndex) {
        const pathParts = file.path.split('/')
        const entry = this.ensureEntry(pathParts)

        entry.type = 'file'
        entry.file = file
        entry.fileIndex = fileIndex
    }

    ensureEntry(pathParts) {
        let currentItem = pathParts.shift()
        let lastEntry

        while(currentItem) {
            const currentParent = lastEntry || this.root

            if(currentParent.children){
                lastEntry = currentParent.children.find((item) => item.title == currentItem)
            } else {
                currentParent.children = []
                currentParent.type = 'dir'
                lastEntry = null
            }

            if(lastEntry == null) {
                lastEntry = {
                    title: currentItem,
                    id: `${++this.maxId}`,
                    parentId: currentParent.id
                }
                currentParent.children.push(lastEntry)
                currentParent.count = currentParent.children.length
                this.flatTree[lastEntry.id] = lastEntry
            }

            currentItem = pathParts.shift()
        }

        return lastEntry
    }

    getRoot() {
        return this.root
    }

    getById(id) {
        return this.flatTree[id]
    }
}

function createTorrentFs(torrent) {
    const torrentFs = new TorrentFs(torrent.infoHash)

    torrent.files.forEach((file, fileIndex) => torrentFs.addFile(file, fileIndex))

    return torrentFs
}

function getTorrentFs(torrent) {
    const infoHash = torrent.infoHash
    let torrentFs = cache[infoHash]

    if(!torrentFs) {
        torrentFs = createTorrentFs(torrent)
        cache[infoHash] = torrentFs
    }

    return torrentFs
}

module.exports = getTorrentFs
module.exports.TorrentFs = TorrentFs