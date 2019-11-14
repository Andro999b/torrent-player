const Provider = require('../Provider')
const urlencode = require('urlencode')
const { twoElemetsRowExtractor } = require('../../../utils/detailsExtractors')

class x1337xProvider extends Provider {
    constructor(categories, subtype) {
        super('x1337x', {
            subtype,
            categories,
            scope: '.table-list.table tr',
            pagenatorSelector: '#next',
            selectors: {
                id: { 
                    selector: 'td:nth-child(1) a:nth-child(2)', 
                    transform: ($el) => urlencode.encode($el.attr('href'))
                },
                name: 'td:nth-child(1) a:nth-child(2)',
                seeds: 'td:nth-child(2)',
                leechs: 'td:nth-child(3)',
                size: 'td:nth-child(4)'
            },
            detailsScope: '.torrent-detail-page',
            detailsSelectors: {
                image: {
                    selector: '.torrent-image-wrap img',
                    transform: ($el) => $el.attr('src')
                },
                description: {
                    selector: 'ul.list li',
                    transform: twoElemetsRowExtractor
                }
            }
        })
    }

    getInfoUrl(resultsId) {
        const { baseUrl } = this.config
        return baseUrl + urlencode.decode(resultsId)
    }

    getSearchUrl(query) {
        const { searchUrl, categories } = this.config

        return `${searchUrl}/${encodeURIComponent(query)}/${categories}/1/`
    }
}

module.exports = x1337xProvider
module.exports.providers = [
    new x1337xProvider('Movies', 'movies'),
    new x1337xProvider('TV', 'tv-shows'),
    new x1337xProvider('Anime', 'anime')
]