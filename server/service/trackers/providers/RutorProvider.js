const Provider = require('../Provider')

const extratId = ($el) => $el.attr('href').split('/')[2]

class RutorProvider extends Provider {
    constructor() {
        super('rutor', {
            scope: '#index>table>tbody>tr:matches(.tum,.gai)',
            selectors: {
                id: { selector: 'td:nth-child(2)>a.downgif', transform: extratId },
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
                'Перевод',
                'Субтитры',
                'Формат',
                'Страна',
                'Режиссер',
                'Жанр',
                'Продолжительность',
                'Год выпуска',
                'В ролях',
                'Описание',
                'Видео',
                'Аудио',
                'Качество',
                'Бюджет',
                'Премьера',
                'Доп.инфо',
                'Также роли дублировали'
            ]  
        })
    }
    
    getSearchUrl(query) {
        const { searchUrl } = this.config
        return `${searchUrl}/${encodeURIComponent(query)}`
    }

    getInfoUrl(resultsId) {
        const { baseUrl } = this.config
        return `${baseUrl}/torrent/${resultsId}`
    }

    _postProcessResultDetails(details, resultsId) {
        const { config: { baseUrl, filterDescription } } = this

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