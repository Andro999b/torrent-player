const Provider = require('../Provider')
const urlencode = require('urlencode')
const { tableLikeExtractor } = require('../../../utils/detailsExtractors')

class LimeTorrentsProvider extends Provider {
    constructor(categories, subtype) {
        super('limetorrents', {
            subtype,
            categories,
            baseUrl: 'https://www.limetorrents.info',
            searchUrl: 'https://www.limetorrents.info/search',
            scope: 'table.table2 tr:not(:first-child)',
            pagenatorSelector: '#next',
            selectors: {
                id: { 
                    selector: 'td:nth-child(1) a:nth-child(2)', 
                    transform: ($el) => urlencode.encode($el.attr('href'))
                },
                name: 'td:nth-child(1) a:nth-child(2)',
                size: 'td:nth-child(3)',
                seeds: 'td:nth-child(4)',
                leechs: 'td:nth-child(5)',
            },
            detailsScope: '.torrentinfo',
            detailsSelectors: {
                description: {
                    selector: '.torrentinfo > table',
                    transform: tableLikeExtractor
                },
                torrentUrl: {
                    selector: '.dltorrent a',
                    transform: ($el) => $el.attr('href')
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

        return `${searchUrl}/${categories}/${encodeURIComponent(query)}`
    }
}

module.exports = LimeTorrentsProvider
module.exports.providers = [
    new LimeTorrentsProvider(
        'movies',
        'movies'
    ),
    new LimeTorrentsProvider(
        'tv', 
        'tv-shows'
    ),
    new LimeTorrentsProvider(
        'anime', 
        'anime'
    )
]