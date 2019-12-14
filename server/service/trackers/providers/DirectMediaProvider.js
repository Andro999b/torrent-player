const Provider = require('../Provider')
const urlencode = require('urlencode')

class DirectMediaProvider extends Provider {
    getType() {
        return 'directMedia'
    }

    getInfoUrl(resultsId) {
        return this._absoluteUrl(urlencode.decode(resultsId))
    }
}

module.exports = DirectMediaProvider