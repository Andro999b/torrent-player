const Provider = require('../Provider')
const superagent = require('superagent')
const urlencode = require('urlencode')
const setRequestProxy = require('../../../utils/setRequestProxy')

require('superagent-charset')(superagent)
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

    _getSiteEncoding() {
        return null
    }

    _crawlerSearchRequestGenerator(query) {
        const { searchUrl, headers, useProxy } = this.config
        const encoding = this._getSiteEncoding()

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
                    story: encoding ? urlencode.encode(query, encoding) : query
                })
                .buffer(true)
                .charset()
                .set(headers)

            if(useProxy) {
                return setRequestProxy(request)
            }

            return request
        }
    }
}

module.exports = DataLifeProvider