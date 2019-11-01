const Provider = require('../Provider')
const urlencode = require('urlencode')

class RarBGProvider extends Provider {
    constructor(categories, subtype) {
        super({
            subtype,
            categories,
            baseUrl: 'https://rarbg2019.org',
            searchUrl: 'https://rarbg2019.org/torrents.php',
            scope: 'tr.lista2',
            pagenatorSelector: '#pager_links>a:last-child',
            pageSize: 50,
            selectors: {
                id: { 
                    selector: 'td:nth-child(2) a', 
                    transform: ($el) => urlencode.encode($el.attr('href'))
                },
                name: 'td:nth-child(2) a',
                size: 'td:nth-child(4)',
                seeds: 'td:nth-child(5)',
                leechs: 'td:nth-child(6)',
            },
            detailsScope: '.table.lista-rounded>tbody>tr>td>div>table.lista',
            detailsSelectors: {
                image: {
                    selector: 'tr:nth-child(3)>td:nth-child(2)>img',
                    transform: ($el) => $el.attr('src')
                },
                description: ''
            }
        })
    }

    getInfoUrl(resultsId) {
        const { baseUrl } = this.config
        return baseUrl + urlencode.decode(resultsId)
    }

    getName() {
        const { subtype } = this.config
        return `rarbg${subtype ? '-' + subtype : ''}`
    }

    getSearchUrl(query) {
        const { searchUrl, categories } = this.config
        if(categories)
            return `${searchUrl}?search=${encodeURIComponent(query)}&category[]=${categories.join('&category[]=')}`
        else
            return `${searchUrl}?search=${encodeURIComponent(query)}`
    }
}

module.exports = RarBGProvider
module.exports.providers = [
    new RarBGProvider(
        [17, 44, 45, 50, 51, 52],
        'movies'
    ),
    new RarBGProvider(
        [18, 41, 49], 
        'tv-shows'
    )
]