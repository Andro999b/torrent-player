const regExprExtractor = require('./regExprExtractor')

module.exports = regExprExtractor([
    /\[HD\](http:\/\/hd\.aniland\.org\/[0-9]+\/[0-9]+\.mp4\?md5=[a-zA-Z0-9-_]+&time=[0-9]+)+/,
    /\[SD\](http:\/\/std\.aniland\.org\/[0-9]+\.mp4\?md5=[a-zA-Z0-9-_]+&time=[0-9]+)+/,
])