const providers = [
    new (require('./providers/TfileProvider'))()
]

module.exports = {
    getTrackers() {
        return providers.map(provider => provider.getName())
    },
    getTracker(name) {
        const provider = providers.find(provider => provider.getName() == name)
        if(provider) {
            return Promise.resolve(provider)
        }
        return Promise.resolve()
    },
    search(tracker, query, page = 0, pageCount = 1) {
        return this.getTracker(tracker)
            .then(provider => provider.search(query, page, pageCount))
    },
    getTorrentInfo(tracker, torrentId) {
        return this.getTracker(tracker)
            .then(provider => provider.getTorrentInfo(torrentId))
    }
}