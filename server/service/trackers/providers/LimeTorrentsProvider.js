const Provider = require('../Provider')
const urlencode = require('urlencode')

class LimeTorrentsProvider extends Provider {
    constructor(categories, subtype) {
        super({
            subtype,
            categories,
            baseUrl: 'https://www.limetorrents.info',
            searchUrl: 'https://www.limetorrents.info/search',
            scope: 'table.table2 tr:not(:first-child)',
            pagenatorSelector: '#next',
            pageSize: 50,
            selectors: {
                id: { 
                    selector: 'td:nth-child(1) a:nth-child(2)', 
                    transform: ($el) => urlencode.encode($el.attr('href'))
                },
                name: 'td:nth-child(1) a:nth-child(2)',
                size: 'td:nth-child(2)',
                seeds: 'td:nth-child(4)',
                leechs: 'td:nth-child(5)',
            },
            detailsScope: '.torrentinfo',
            detailsSelectors: {
                description: {
                    selector: '.torrentinfo > table',
                    transform: ($el) => {
                        return $el.text().split('\n')
                            .map((line) => {
                                const parts = line.split(':')
                                let name = parts[0] && parts[0].trim()
                                const value = parts[1] && parts[1].trim()

                                name = name.substring(0, name.length - 1)

                                return { name, value }
                            })
                            .filter((item) => item && item.name && item.value)
                    }
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

    getName() {
        const { subtype } = this.config
        return `limetorrents${subtype ? '-' + subtype : ''}`
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