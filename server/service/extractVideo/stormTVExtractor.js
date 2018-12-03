const regExprExtractor = require('./regExprExtractor')

module.exports = regExprExtractor([
    /(\[HD\])?(https:\/\/www\.stormo\.tv\/get_file\/[a-z0-9\/]+\.mp4\/?\?embed=true)+/
])