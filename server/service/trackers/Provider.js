const crawler = require('../../utils/crawler')
const parseTorrent = require('parse-torrent')
const urlencode = require('urlencode')

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
                magnetUrl: { 
                    selector: 'a[href*="magnet:?xt=urn:btih:"]', 
                    transform: ($el) => $el.attr('href') 
                }
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
        const {
            scope,
            selectors,
            pagenatorSelector,
            userAgent,
            pageSize,
            encoding
        } = this.config

        const limit = pageCount * pageSize

        return crawler
            .get(this.getSearchUrl(urlencode(query, encoding), page))
            .headers({
                'User-Agent': userAgent
            })
            .scope(scope)
            .set(selectors)
            .paginate(pagenatorSelector)
            .limit(limit)
            .gather() 
            .then(this._postProcessResult.bind(this))
            .then((results) =>
                results.map((item) => {
                    item.provider = name
                    return item
                })
            )
    }

    getInfo(resultsId) {
        const { detailsScope, detailsSelectors, userAgent } = this.config

        return crawler
            .get(this.getInfoUrl(resultsId))
            .headers({
                'User-Agent': userAgent
            })
            .scope(detailsScope)
            .set(detailsSelectors)
            .gather() 
            .then((details) => details[0])
            .then((details) => this._postProcessResultDetails(details, resultsId))
            .then(this._loadTorrentFileInfo.bind(this))
    }

    // eslint-disable-next-line no-unused-vars
    getSearchUrl(query, page) {
        throw new Error('Provider not implement _getSearchUrl()')
    }

    // eslint-disable-next-line no-unused-vars
    getInfoUrl(resultsId) {
        throw new Error('Provider not implement getInfoUrl()')
    }

    _postProcessResult(results) {
        results.forEach((result) => result.infoUrl = this.getInfoUrl(result.id))
        return results
    }

    _postProcessResultDetails(details) {
        return details
    }

    _loadTorrentFileInfo(details) {
        if(!details.torrentUrl) {
            return Promise.resolve(details)
        }

        return new Promise((resolve, reject) => {
            parseTorrent.remote(details.torrentUrl, (err, parsedTorrent) => {
                if (err) {
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
