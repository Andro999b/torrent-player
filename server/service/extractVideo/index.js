const ResponseError = require('../../utils/ResponseError')

const extractors = {
    'stormTv': require('./stormTVExtractor')
}

module.exports = async (type, url) => {
    const extractor = extractors[type]

    if(!extractor)
        throw ResponseError(`Extractor for ${type} not found`)

    return extractor(url)
}