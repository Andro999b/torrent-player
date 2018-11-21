const Provider = require('../Provider')
const $ = require('cheerio')

class NNMClubProvider extends Provider {
    constructor(categories, subtype) {
        super({
            subtype,
            categories,
            baseUrl: 'http://nnmclub.to',
            searchUrl: 'http://nnmclub.to/forum/tracker.php',
            scope: '.tablesorter>tbody>tr:matches(.prow1,.prow2)',
            pageSize: 50,
            selectors: {
                id: { 
                    selector: '.topictitle', 
                    transform: ($el) => {
                        const href = $el.attr('href')
                        href ? href.split('=')[1] : null
                    }
                },
                name: '.topictitle>b',
                size: { 
                    selector: 'td:nth-child(6)', 
                    transform: ($el) => {
                        const parts = $el.text().split(' ')
                        return `${parts[1]} ${parts[2]}`
                    }
                },
                seeds: '.seedmed>b',
                leechs: '.leechmed>b',
            },
            detailsScope: '.row1>table>tbody',
            detailsSelectors: {
                image: { selector: '.postImg', 
                    transform: ($el) => {
                        const src = $el.attr('title')
                        if(src) {
                            const imgurSrc = src.split('=')[1]
                            return imgurSrc ? imgurSrc : src
                        }
                    } 
                },
                description: { 
                    selector: '.postbody',
                    transform: ($el) => {
                        const descriptionNodes = $el.children()
                            .slice(1)
                            .toArray()


                        return descriptionNodes.map((node) => {
                            if(node.name != 'span' || !node.next || node.next.type != 'text') return

                            let name = $(node).text().trim()
                            let value = node.next.data.trim()

                            if(name.endsWith(':'))
                                name = name.substring(0, name.length - 1).trim()

                            if(value.startsWith(':'))
                                value = value.substring(1, value.length).trimLeft()

                            return { name, value }
                        })
                            .filter((item) => item && item.name && item.value)
                    } 
                },
                name: '.postbody>span:first-child',
                torrentUrl: {
                    selector: '.btTbl a',
                    transform: ($el) => {
                        const linkHref = $el.attr('href')
                        if(linkHref && linkHref.startsWith('download'))
                            return `${this.config.baseUrl}/forum/${linkHref}`
                        return null
                    }
                }
            }
        })
    }

    getName() {
        const { subtype } = this.config
        return `nnm${subtype ? '-' + subtype : ''}`
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
}

module.exports = NNMClubProvider
module.exports.providers = [
    new NNMClubProvider(
        [216,270,218,219,954,888,217,1293,1298,266,318,320,677,1177,319,678,885,908,909,910,911,912,220,221,222,882,889,224,225,226,227,1296,891,1299,682,694,884,1211,693,913,228,1150,254,321,255,906],
        'video'
    ),
    new NNMClubProvider(
        [1219,1221,1220,768,779,778,788,1288,787,1196,1141,777,786,803,776,785,775,1265,1242,1289,774,1140,782,773,1142,784,1195,772,771,783,1144,804,1290,1300,770,922,780,781,769,799,800,791,798,797,790,793,794,789,796,792,795,1307,683,573,501,919,566,498,985,720,987,664,497,721,719,1229,1228,849,949,665,986,666,1230,722,1120,920,570,499],
        'tv-shows'
    ),
    new NNMClubProvider(
        [615,616,1297,648,617,619,620,623,622,621,632,624,627,626,625,644,628,635,634,638,646], 
        'anime'
    )
]