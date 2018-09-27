const Provider = require('../Provider')
const urlencode = require('urlencode')
const $ = require('cheerio')

const nameExtractRrgExp = /([^\/]+)\.torrent/

class ColdFilmProvider extends Provider {
    constructor() {
        super({
            baseUrl: 'http://coldfilm.cc',
            searchUrl: 'http://coldfilm.cc/search',
            scope: '.sres-wrap',
            pageSize: 50,
            selectors: {
                id: {
                    transform: ($el) => urlencode($el.attr('href'))
                },
                name: '.sres-text>h2'
            },
            detailsScope: '.player-box',
            detailsSelectors: {
                image: { 
                    selector: 'img:first-child',
                    transform: ($el) => $el.attr('src')
                },
                torrents: {
                    selector: 'a',
                    transform: ($el) => $el
                        .toArray()
                        .map((node) => {
                            const href = $(node).attr('href')
                            return {
                                type: 'torrent',
                                torrentUrl: href,
                                name: href.match(nameExtractRrgExp)[1] || href
                            }
                        })
                        .filter(({ torrentUrl }) => torrentUrl.endsWith('.torrent'))
                }
            }
        })
    }

    getType() {
        return 'torrentsList'
    }

    getName() {
        return 'coldfilm'
    }

    getSearchUrl(query) {
        const { searchUrl } = this.config
        return `${searchUrl}?q=${query}`
    }

    getInfoUrl(resultsId) {
        return urlencode.decode(resultsId)
    }
}

module.exports = ColdFilmProvider