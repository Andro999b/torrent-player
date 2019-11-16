const regExprExtractor = require('./regExprExtractor')

module.exports = regExprExtractor([
    /\[HD[^\]]*\](https?:\/\/hd\.animegost\.org\/[0-9]+\/[0-9]+\.mp4\?md5=[a-zA-Z0-9-_]+&time=[0-9]+)+/,
    /\[HD[^\]]*\](https?:\/\/hd\.aniland\.org\/[0-9]+\/[0-9]+\.mp4\?md5=[a-zA-Z0-9-_]+&time=[0-9]+)+/,
    /\[SD[^\]]*\](https?:\/\/std\.animegost\.org\/[0-9]+\.mp4\?md5=[a-zA-Z0-9-_]+&time=[0-9]+)+/,
    /\[SD[^\]]*\](https?:\/\/std\.aniland\.org\/[0-9]+\.mp4\?md5=[a-zA-Z0-9-_]+&time=[0-9]+)+/,
])