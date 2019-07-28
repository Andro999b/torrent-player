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
                        return href ? href.split('=')[1] : null
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
            return `${searchUrl}?f=${categories.join(',')}&nm=${encodeURIComponent(query)}`
        else
            return `${searchUrl}?nm=${encodeURIComponent(query)}`
    }

    getInfoUrl(resultsId) {
        const { baseUrl } = this.config
        return `${baseUrl}/forum/viewtopic.php?t=${resultsId}`
    }
}

module.exports = NNMClubProvider
module.exports.providers = [
    new NNMClubProvider(
        [730,732,230,659,658,231,660,661,890,232],
        'cartoons'
    ),
    new NNMClubProvider(
        [16,270,218,219,954,888,318,320,677,1177,319,678,885,908,1310,909,910,911,912,220,221,222,882,224,225,226,227,1296,1299,682,694,884,693,254,321,255,906],
        'movies'
    ),
    new NNMClubProvider(
        [1219,1221,1220,768,779,778,788,1288,787,1196,1141,777,786,803,776,785,775,1265,1242,1289,774,1140,782,773,784,1142,1195,772,771,783,1144,804,1290,722,1300,770,922,780,781,769,799,800,791,798,797,790,793,794,789,796,792,795,1307],
        'tv-shows'
    ),
    new NNMClubProvider(
        [624,627,626,625,644], 
        'anime'
    )
]