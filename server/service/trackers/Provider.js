const osmosis = require('osmosis')
const parseTorrent = require('parse-torrent')
const debug = require('debug')('tracker-provider')

class Provider {
    constructor(config) {
        this.config = Object.assign(
            {
                pageSize: 50,
                encoding: 'utf-8',
                scope: '',
                slectors: {},
                pagenatorSelector: '',
                userAgent: 'Mozilla/5.0 Gecko/20100101 Firefox/59.0',
                detailsScope: 'body'
            },
            config
        )

        this.config.detailsSelectors = Object.assign(
            {
                magnetUrl: 'a[href*="magnet:?xt=urn:btih:"]@href'
            },
            this.config.detailsSelectors
        )
    }

    getName() {
        throw new Error('Provider not implement getName()')
    }

    search(query, page, pageCount) {
        if (page < 1) page = 1
        if (pageCount < 1) pageCount = 1

        const name = this.getName()
        const { scope, selectors, pagenatorSelector, userAgent, pageSize } = this.config

        return new Promise(
            (resolve) => {
                const results = []
                const limit = pageCount * pageSize

                osmosis.get(this.getSearchUrl(query, page))
                    .config({
                        headers: {
                            'User-Agent': userAgent
                        }
                    })
                    .find(scope)
                    .log(debug)
                    .set(selectors)
                    .paginate(pagenatorSelector)
                    .then(function (context, data, next, done) {
                        if (results.length < limit) {
                            next(context, data)
                        } else {
                            done()
                        }
                    })
                    .data(items => results.push(items))
                    .done(() => {
                        resolve(results)
                    })
                    .error(() => {
                        resolve(results)
                    })
            }
        )
            .then(this._postProcessResult.bind(this))
            .then((results) => results.map((item) => {
                item.provider = name
                return item
            }))
    }

    getTorrentInfo(torrentId) {
        const { detailsScope, detailsSelectors, userAgent } = this.config

        return new Promise(
            (resolve, reject) => {
                osmosis.get(this.getTorrentInfoUrl(torrentId))
                    .config({
                        headers: {
                            'User-Agent': userAgent
                        }
                    })
                    .find(detailsScope)
                    .log(debug)
                    .set(detailsSelectors)
                    .data(resolve)
                    .error(reject)
            }
        )
            .then(this._postProcessResultDetails.bind(this))
            .then(this._loadTorrentFileInfo.bind(this))
    }

    // eslint-disable-next-line no-unused-vars
    getSearchUrl(query, page) {
        throw new Error('Provider not implement _getSearchUrl()')
    }

    // eslint-disable-next-line no-unused-vars
    getTorrentInfoUrl(torrentId) {
        throw new Error('Provider not implement getTorrentInfo()')
    }

    _postProcessResult(results) { return results }

    _postProcessResultDetails(details) { return details }

    _loadTorrentFileInfo(details) {
        return new Promise(
            (resolve, reject) => {
                parseTorrent.remote(details.torrentUrl, (err, parsedTorrent) => {
                    if(err) {
                        reject(err)
                        return
                    }

                    details.files = parsedTorrent.files.map((file) => ({
                        name: file.name,
                        length: file.length
                    }))

                    resolve(details)
                })
            })
    }
}

module.exports = Provider