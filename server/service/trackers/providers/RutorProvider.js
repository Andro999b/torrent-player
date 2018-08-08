const Provider = require('../Provider')

const extratId = ($el) => $el.attr('href').split('/')[2]

class RutorProvider extends Provider {
    constructor() {
        super({
            baseUrl: 'http://rutor.is',
            searchUrl: 'http://rutor.is/search/0/0/000/2',
            scope: '#index>table>tbody>tr:matches(.tum,.gai)',
            pageSize: 50,
            selectors: {
                id: { selector: 'td:nth-child(2)>a.downgif', transform: extratId},
                name: 'td:nth-child(2)',
                size: 'td:nth-last-child(2)',
                seeds: 'td:nth-last-child(1)>span.green',
                leechs: 'td:nth-last-child(1)>span.red',
            },
            detailsScope: '#details',
            detailsSelectors: {
                image: { selector: '>tbody>tr:first-child>td>img', transform: ($el) => $el.attr('src') },
                description: '>tbody>tr:first-child>td'
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
        return 'rutor'
    }

    getSearchUrl(query) {
        const { searchUrl } = this.config
        return `${searchUrl}/${query}`
    }

    getInfoUrl(resultsId) {
        const { baseUrl } = this.config
        return `${baseUrl}/torrent/${resultsId}`
    }

    _postProcessResultDetails(details, resultsId) {
        const { config: { baseUrl }, filterDescription } = this

        const rawDescription = details.description.replace(/[\n\r]+/g, '\n').trim()
        let parts = rawDescription.split('\n').slice(0, -1)

        //extract titles
        let usedNames = []
        details.description = parts.slice(1).reduce((acc, item) => {
            const pair = item.split(': ', 2)
            if (pair.length == 2) {
                const name = pair[0].trim()
                const value = pair[1].trim()

                if (value && name) {
                    if(name === 'Название') {
                        details.name = value
                        return acc
                    }

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

        details.torrentUrl = `${baseUrl}/download/${resultsId}`

        return details
    }
}

module.exports = RutorProvider