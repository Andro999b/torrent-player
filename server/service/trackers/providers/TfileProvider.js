const Provider = require('../Provider')
const urlencode = require('urlencode')

module.exports = class TfileProvider extends Provider {
    constructor() {
        super({
            encoding: 'windows-1251',
            baseUrl: 'http://tfile.cc',
            searchUrl: 'http://tfile-search.cc',
            pageSize: 50,
            scope: '.tor',
            selectors: {
                torrent: '@id',
                title: '.t a',
                size: '.dl',
                seeds: '.dl:skip(1)',
                leechs: '.dl:skip(2)'
            },
            pagenatorSelector: 'a.next',
            detailsScope: '.pC:first',
            detailsSelectors: {
                image: 'img.postImgAligned@src',
                description: '.pT',
                torrentUrl: '#dlbt@href'
            }
        })

        this.filterDescription = [
            'Перевод', 'Субтитры', 'Формат', 'Страна', 'Режиссер', 'Жанр', 'Продолжительность',
            'Год выпуска', 'В ролях', 'Описание', 'Видео', 'Аудио'
        ]
    }

    getName() {
        return 'tfile'
    }

    getSearchUrl(query, page) {
        const { searchUrl, encoding, pageSize } = this.config
        return searchUrl +
            '?q=' + urlencode.encode(query, encoding) + '&c=2' +
            '&start=' + pageSize * (page - 1)
    }

    getTorrentInfoUrl(torrentId) {
        return this.config.baseUrl + '/forum/viewtopic.php?t=' + torrentId.slice(1)
    }

    _postProcessResultDetails(details) {
        const { filterDescription } = this
        const rawDescription = details.description.replace(/[\n\r]+/g, '\n')
        let parts = rawDescription.split('\n').slice(0, -1)

        //extract titles
        let usedNames = []
        details.title = parts[0]
        details.description = parts.slice(1).reduce((acc, item) => {
            const pair = item.split(': ', 2)
            if (pair.length == 2) {
                const name = pair[0].trim()
                const value = pair[1].trim()
                if (value && name) {
                    if (
                        filterDescription.indexOf(name) != -1 &&
                        usedNames.indexOf(name) == -1
                    ) {
                        usedNames.push(name)
                        acc.push({ name, value })
                    }
                }
            }
            return acc
        }, [])

        details.torrentUrl = this.config.baseUrl + '/forum/' + details.torrentUrl

        return details
    }
}