const superagent = require('superagent')

module.exports = (regExps) => async (url) => {
    const res = await superagent.get(url)

    for(let extractExpr of regExps) {
        const matches = res.text.match(extractExpr)

        if(matches == null || matches.length < 1)
            continue

        return matches[matches.length - 1]
    }
    
    throw Error('Video can`t be extracted')
}