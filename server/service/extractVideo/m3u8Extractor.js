const regExprExtractor = require('./regExprExtractor')

module.exports = regExprExtractor([
    /(https?.+\.m3u8)/,
])