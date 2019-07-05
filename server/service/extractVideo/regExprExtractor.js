const superagent = require('superagent')
const directExtractor = require('./directExtractor')

module.exports = (regExps) => async (params, res) => {
    const { url } = params
    const siteRes = await superagent.get(url)

    for(let extractExpr of regExps) {
        const matches = siteRes.text.match(extractExpr)

        if(matches == null || matches.length < 1)
            continue

        const videoUrl = matches[matches.length - 1]        
        if(params.hasOwnProperty('noredirect')) {
            await directExtractor({...params, url: videoUrl}, res)
        } else {
            res.redirect(matches[matches.length - 1])
        }
        
        return
    }
    
    throw Error('Video can`t be extracted')
}