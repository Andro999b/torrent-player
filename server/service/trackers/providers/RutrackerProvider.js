const Provider = require('../Provider')
const fs = require('fs-extra')
const path = require('path')
const { ROOT_DIR } = require('../../../config')

let bb_cookie = ''
try{
    const buf = fs.readFileSync(path.join(ROOT_DIR, 'rutracker-session'))
    bb_cookie = `bb_session=${buf.toString('utf-8')}`
} catch(err) {
    console.error(`Fail to read ru tracker seesion file: ${err}`)
}

class RuTrackerProvider extends Provider {
    constructor(categories, subtype) {
        super({
            subtype,
            categories,
            baseUrl: 'https://rutracker.org',
            searchUrl: 'https://rutracker.org/forum/tracker.php',
            headers: {
                'User-Agent': 'Mozilla/5.0 Gecko/20100101 Firefox/59.0',
                'Cookie': bb_cookie
            },
            scope: '.tablesorter>tbody>.hl-tr',
            pageSize: 50,
            selectors: {
                id: { 
                    selector: 'td.t-title .tLink', 
                    transform: ($el) => $el.attr('data-topic_id')
                },
                name: 'td.t-title .tLink',
                size: '.tor-size a',
                seeds: '.seedmed',
                leechs: '.leechmed',
            },
            detailsScope: 'tbody.row1',
            detailsSelectors: {
                image: { 
                    selector: '.postImg', 
                    transform: ($el) => {
                        return $el.attr('title')
                    }
                },
                description: '.post_body',
                torrentUrl: {
                    selector: '.dl-link',
                    transform: ($el) => {
                        const { baseUrl } = this.config
                        const href = $el.attr('href')
                        return href ? `${baseUrl}/forum/${href}` : null
                    }
                }
            },
            filterDescription: [
                'Качество'
            ]  
        })
    }

    getName() {
        const { subtype } = this.config
        return `rutracker${subtype ? '-' + subtype : ''}`
    }

    getSearchUrl(query) {
        const { searchUrl, categories } = this.config
        if(categories)
            return `${searchUrl}?f=${categories.join(',')}&nm=${query}`
        else
            return `${searchUrl}?nm=${query}`
    }

    getInfoUrl(resultsId) {
        const { baseUrl } = this.config
        return `${baseUrl}/forum/viewtopic.php?t=${resultsId}`
    }

    _postProcessResultDetails(details) {
        const { filterDescription } = this

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

        return details
    }
}

module.exports = RuTrackerProvider
module.exports.providers = [
    new RuTrackerProvider(
        [100,101,1235,124,140,1457,1543,1576,1577,1666,1670,185,187,194,1950,2090,2091,2092,2093,212,2198,2199,22,2200,2201,2220,2221,2339,2459,2540,312,313,376,505,511,572,7,709,877,905,93,934,941],
        'movies'
    ),
    new RuTrackerProvider(
        [104,106,110,1102,1120,1144,1171,119,121,1214,123,1242,1301,1356,1359,1408,1417,1449,1493,1498,1531,1535,1537,1539,1574,166,1669,1690,172,173,175,1798,181,184,188,189,193,1938,1939,1940,1949,195,202,2100,2102,2104,235,236,2366,2370,2391,2392,2393,2394,2395,2396,2397,2398,2399,2400,2402,2403,2404,2405,2406,2407,2408,2412,242,252,265,266,273,310,325,372,387,504,507,534,536,594,606,607,625,636,694,704,717,718,721,743,775,781,79,80,805,81,812,819,820,84,842,85,856,9,91,911,915,918,920,935,990], 
        'tv-shows'
    ),
    new RuTrackerProvider(
        [1460,1900,208,209,2258,2343,2365,4,484,521,539,815,816,822,921,930], 
        'cartoons'
    ),
    new RuTrackerProvider(
        [1105,1386,1387,1389,1390,1391,1642,2484,2491,33,404,599,809,893], 
        'anime'
    )
]