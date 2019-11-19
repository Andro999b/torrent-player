const Provider = require('../Provider')
const urlencode = require('urlencode')

class DirectMediaProvider extends Provider {
    getType() {
        return 'directMedia'
    }

    getInfoUrl(resultsId) {
        const url = urlencode.decode(resultsId)
        return url.startsWith('/') ? this.config.baseUrl + url : url
    }
}

module.exports = DirectMediaProvider