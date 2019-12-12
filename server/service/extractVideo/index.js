const ResponseError = require('../../utils/ResponseError')

const extractors = {
    'stormTv': require('./stormTVExtractor'),
    'animevost': require('./animevostExtractor'),
    'anidub': require('./anidubExtractor'),
    'streamguard': require('./streamguardExtractor'),
    'direct': require('./directExtractor'),
    '123moviesapp': require('./movies123AppExtractor'),
}

module.exports = async (parmas, res) => {
    const { type } = parmas
    const extractor = extractors[type]

    if(!extractor)
        throw new ResponseError(`Extractor for ${type} not found`)

    await extractor(parmas, res)
}