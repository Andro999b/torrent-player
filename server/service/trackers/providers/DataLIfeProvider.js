const Provider = require('../Provider')
const superagent = require('superagent')
const urlencode = require('urlencode')

class DataLifeProvider extends Provider {
    constructor(config) {
        super(config)
    }

    getType() {
        return 'directMedia'
    }

    getSearchUrl() {}

    getInfoUrl(resultsId) {
        return urlencode.decode(resultsId)
    }

    _crawlerRequestGenerator(query) {
        const { searchUrl, headers } = this.config

        return () => {
            return superagent
                .post(searchUrl)
                .type('form')
                .field({ 
                    do: 'search',
                    subaction: 'search',
                    search_start: 0,
                    full_search: 0,
                    result_from: 1,
                    story: query
                })
                .set(headers)
        }
    }
}

module.exports = DataLifeProvider