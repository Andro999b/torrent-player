const providers = [
    new (require('./providers/RutorProvider'))(),
    new (require('./providers/AnimeVostProvider'))(),
    new (require('./providers/AnidubProvider'))(),
    new (require('./providers/KinokradProvider'))(),
    new (require('./providers/HDRezkaProvider'))(),
    new (require('./providers/KinogoProvider'))(),
    new (require('./providers/BaskinoProvider'))(),
    new (require('./providers/SeasonvarProvider'))(),
    new (require('./providers/FilmixProvider'))(),
    new (require('./providers/1337XTOProvider'))(),
    new (require('./providers/LimeTorrentsProvider'))(),
    ...require('./providers/NNMClubProvider').providers,
    ...require('./providers/FastTorrentsProvider').providers
    // ...require('./providers/RutrackerProvider').providers,
]

module.exports = {
    getTrackers() {
        return providers.map((provider) => provider.getName())
    },
    async getTracker(name) {
        const provider = providers.find((provider) => provider.getName() == name)
        if (provider) {
            return Promise.resolve(provider)
        }
        return Promise.reject(`No provider found for ${name}`)
    },
    async search(tracker, query, page = 0, pageCount = 1) {
        const provider = await this.getTracker(tracker)
        return await provider.search(query, page, pageCount)
    },
    async getInfo(tracker, resultsId) {
        const provider = await this.getTracker(tracker)
        return await provider.getInfo(resultsId)
    },
    async loadTorentFile(tracker, torrentUrl) {
        const provider = await this.getTracker(tracker)
        return provider.loadTorentFile(torrentUrl)
    }
}