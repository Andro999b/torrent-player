const Provider = require('../Provider')

module.exports = class TfileProvider extends Provider {
    constructor() {
        super({
            encoding: 'windows-1251',
            baseUrl: 'http://tfile-home.org',
            searchUrl: 'http://tfile-search.cc',
            pageSize: 50,
            scope: '.tor',
            selectors: {
                id: { transform: ($el) => $el.attr('id').substr(1) },
                name: '.t a',
                size: {
                    selector: '.dl',
                    transform: ($el) =>
                        $el
                            .eq(0)
                            .text()
                            .trim()
                },
                seeds: {
                    selector: '.dl',
                    transform: ($el) =>
                        $el
                            .eq(1)
                            .text()
                            .trim()
                },
                leechs: {
                    selector: '.dl',
                    transform: ($el) =>
                        $el
                            .eq(2)
                            .text()
                            .trim()
                }
            },
            pagenatorSelector: 'a.next',
            detailsScope: '.pC',
            detailsSelectors: {
                image: {
                    selector: 'img.postImgAligned',
                    transform: ($el) => $el.attr('src')
                },
                description: '.pT',
                torrentUrl: {
                    selector: '#dlbt',
                    transform: ($el) => $el.attr('href')
                }
            },
            filterDescription: [
                'Качество',
                'Бюджет',
                'Премьера',
                'Доп.инфо',
                'Также роли дублировали'
            ]
        })
    }

    getName() {
        return 'tfile'
    }

    getSearchUrl(query, page) {
        const { searchUrl, pageSize } = this.config
        return `${searchUrl}?q=${query}&с=2&start=${pageSize * (page - 1)}`
    }

    getInfoUrl(resultsId) {
        const { baseUrl } = this.config
        return `${baseUrl}/forum/viewtopic.php?t=${resultsId}`
    }

    _postProcessResultDetails(details) {
        const {
            filterDescription,
            config: { baseUrl }
        } = this
        const rawDescription = details.description
            .replace(/[\n\r]+/g, '\n')
            .trim()
        let parts = rawDescription.split('\n').slice(0, -1)

        //extract titles
        let usedNames = []
        details.name = parts[0]
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

        details.torrentUrl = `${baseUrl}/forum/${details.torrentUrl}`

        return details
    }
}
