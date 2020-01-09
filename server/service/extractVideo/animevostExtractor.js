const regExprExtractor = require('./regExprExtractor')

module.exports = regExprExtractor([
    /\[HD[^\]]*\](https?[0-9a-zA-Z/:.?=+/_&]+)+/,
    /\[SD[^\]]*\](https?[0-9a-zA-Z/:.?=+/_&]+)+/
])