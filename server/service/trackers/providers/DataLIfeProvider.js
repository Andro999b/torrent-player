const Provider = require('../Provider')
const superagent = require('superagent')
const urlencode = require('urlencode')
const setRequestProxy = require('../../../utils/setRequestProxy')

require('superagent-proxy')(superagent)

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

    _crawlerSearchRequestGenerator(query) {
        const { searchUrl, headers, useProxy } = this.config

        return () => {
            const request = superagent
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

            if(useProxy) {
                return setRequestProxy(request)
            }

            return request
        }
    }
}

module.exports = DataLifeProvider