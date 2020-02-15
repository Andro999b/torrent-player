const regExprExtractor = require('./regExprExtractor')

module.exports = regExprExtractor([
    /\[HD[^\]]*\](https?[^\s"]+)/,
    /\[SD[^\]]*\](https?[^\s"]+)/
])