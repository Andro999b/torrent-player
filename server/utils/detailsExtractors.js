const $ = require('cheerio')

module.exports.tableLikeExtractor = function($el) {
    return $el.text()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line)
        .map((line) => {
            const parts = line.split(':')
            let name = parts[0] && parts[0].trim()
            const value = parts[1] && parts[1].trim()

            name = name.substring(0, name.length - 1)

            return { name, value }
        })
        .filter((item) => item && item.name && item.value)
}

module.exports.rowsLikeExtractor = function($el) {
    return $el.toArray()
        .map((node) => $(node).text())
        .map((text) => {
            const parts = text.split(':')

            if(parts.lenght < 2) return

            const name = parts[0]
            const value = parts.slice(1).join().trimLeft().replace(/\n+/, '')

            return { name, value }
        })
        .filter((item) => item && item.name && item.value)
}

module.exports.twoElemetsRowExtractor = function($el) {
    return $el.toArray()
        .map((row) => {
            const $row = $(row)
            const $children = $row.children()

            if($children.length > 1) {
                return {
                    name: $children.eq(0).text().trim().replace(':',  ''),
                    value: $children.eq(1).text().trim()
                }
            } else {
                return null
            }
        })
        .filter((item) => item && item.name && item.value)
}