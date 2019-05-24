const superagent = require('superagent')

module.exports = (regExps) => async ({ url }, res) => {
    const siteRes = await superagent.get(url)

    for(let extractExpr of regExps) {
        const match = siteRes.text.match(extractExpr)

        if(match == null)
            continue

        res.redirect(match)
        return
    }
    
    throw Error('Video can`t be extracted')
}