const superagent = require('superagent')

module.exports = (regExps) => async ({ url }, res) => {
    const siteRes = await superagent.get(url)

    for(let extractExpr of regExps) {
        const matches = siteRes.text.match(extractExpr)

        if(matches == null || matches.length < 1)
            continue

        res.redirect(matches[matches.length - 1])
        return
    }
    
    throw Error('Video can`t be extracted')
}