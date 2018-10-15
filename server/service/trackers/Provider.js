const crawler = require('../../utils/crawler')
const parseTorrent = require('parse-torrent')
const superagent = require('superagent')
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
                headers: {
                    'User-Agent': 'Mozilla/5.0 Gecko/20100101 Firefox/59.0'
                },
                detailsScope: 'body',
                filterDescription: []
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

        this.filterDescription = [
            'Перевод',
            'Субтитры',
            'Формат',
            'Страна',
            'Режиссер',
            'Жанр',
            'Продолжительность',
            'Год выпуска',
            'В ролях',
            'Описание',
            'Видео',
            'Аудио',
        ].concat(this.config.filterDescription)
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
            headers,
            pageSize,
            encoding
        } = this.config

        const limit = pageCount * pageSize

        return crawler
            .get(
                this.getSearchUrl(urlencode(query, encoding), page), 
                this._crawlerRequestGenerator(query, page)
            )
            .headers(headers)
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
        const { detailsScope, detailsSelectors, headers } = this.config

        return crawler
            .get(this.getInfoUrl(resultsId))
            .headers(headers)
            .scope(detailsScope)
            .set(detailsSelectors)
            .gather() 
            .then((details) => details[0])
            .then((details) => this._postProcessResultDetails(details, resultsId))
            .then((details) => ({...details, type: this.getType()}))
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

    getType() {
        return 'torrent'
    }

    _postProcessResult(results) {
        results.forEach((result) => {
            result.infoUrl = this.getInfoUrl(result.id)
            if(result.seeds) result.seeds = parseInt(result.seeds)
            if(result.leechs) result.leechs = parseInt(result.leechs)
        })
        return results
    }

    _postProcessResultDetails(details) {
        return details
    }

    _crawlerRequestGenerator(query, page) {} // eslint-disable-line

    _loadTorrentFileInfo(details) {
        if(!details.torrentUrl) {
            return details
        }

        return superagent
            .buffer(true)
            .get(details.torrentUrl)
            .then((res) => {
                return parseTorrent(res.body)
            })
            .then((parsedTorrent) => {
                const files = parsedTorrent.files.map((file, fileIndex) => {
                    const lastSeparator = file.path .lastIndexOf('/')
                    const path = lastSeparator > -1 ? file.path.substring(0, lastSeparator) : ''

                    return {
                        path,
                        name: file.name,
                        id: fileIndex,
                        length: file.length
                    }
                })

                return { ...details, files }
            })
    }
}

module.exports = Provider
