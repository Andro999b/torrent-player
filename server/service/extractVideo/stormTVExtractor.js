const superagent = require('superagent')

const extractExpr = /(\[HD\])?(https:\/\/www\.stormo\.tv\/get_file\/[a-z0-9\/]+\.mp4\/?\?embed=true)+/

module.exports = async (url) => {
    const res = await superagent.get(url)
    const matches = res.text.match(extractExpr)

    if(matches == null || matches.length < 1)
        throw Error('Video can`t be extracted')

    return matches[matches.length - 1]
}