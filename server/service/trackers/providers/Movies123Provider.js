const Provider = require('../Provider')
const urlencode = require('urlencode')

class Movies123Provider extends Provider {
    constructor(subtype) {
        super({
            subtype,
            baseUrl: 'https://movies123.pro',
            searchUrl: 'https://movies123.pro/search/',
            pageSize: 100,
            scope: 'movie',
            selectors: {
                id: {
                    transform: ($el) => {
                        const { baseUrl } = this.config
                        const path = $el.parents('a').attr('href')

                        return urlencode.encode(`${baseUrl}${path}`)
                    }
                },
                name: 'p'
            },
            pagenatorSelector: 'li.next a',
            detailsScope: '._watched',
            detailsSelectors: {
                image: '',
                description: '',
                files: ''
            }
        })
    }

    getName() {
        const { subtype } = this.config
        return `movies123${subtype ? '-' + subtype : ''}`
    }

    getType() {
        return 'directMedia'
    }

    getSearchUrl(query) {
        const { searchUrl, subtype } = this.config
        return `${searchUrl}${encodeURIComponent(query)}/${subtype}`
    }

    getInfoUrl(resultsId) {
        return urlencode.decode(resultsId)
    }
}

module.exports = Movies123Provider
module.exports.providers = [
    new Movies123Provider('movies'),
    new Movies123Provider('series')
]