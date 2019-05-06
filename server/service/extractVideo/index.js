const ResponseError = require('../../utils/ResponseError')

const extractors = {
    'stormTv': require('./stormTVExtractor'),
    'animevost': require('./animevostExtractor')
}

module.exports = async (type, url) => {
    const extractor = extractors[type]

    if(!extractor)
        throw new ResponseError(`Extractor for ${type} not found`)

    return extractor(url)
}