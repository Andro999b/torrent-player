const regExprExtractor = require('./regExprExtractor')

module.exports = regExprExtractor([
    /\[HD\](http:\/\/hd\.aniland\.org\/[0-9]+\/2147409229\.mp4\?md5=[a-zA-Z0-9-]+&time=[0-9]+)+/,
    /\[SD\](http:\/\/std\.aniland\.org\/2147409229\.mp4\?md5=[a-zA-Z0-9-]+&time=[0-9]+)+/,
])