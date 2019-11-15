const requestFactory = require('./requestFactory')
const { BaseCrawler } = require('./baseCrawler')

class Crawler extends BaseCrawler {
    constructor(url, requestGenerator) {
        super(url, requestGenerator || (async (nextUrl) => {
            const targetUrl = nextUrl != this._url ? 
                new URL(nextUrl, this._url).toString() :
                nextUrl

            const request = requestFactory({ proxy: this.useProxy })
                .get(targetUrl)
                .buffer(true)
                .charset()
                .set(this._headers)

            return request
        }))
        this.useProxy = false
    }

    proxy(useProxy) {
        this.useProxy = useProxy
        return this
    }
}

module.exports = {
    Crawler,
    get(url, requestGenerator) {
        return new Crawler(url, requestGenerator)
    }
}
