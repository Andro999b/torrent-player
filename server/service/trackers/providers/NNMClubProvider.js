const Provider = require('../Provider')
const $ = require('cheerio')

const extratId = ($el) => $el.attr('href').split('=')[1]

class NNMClubProvider extends Provider {
    constructor() {
        super({
            baseUrl: 'http://nnm-club.me',
            searchUrl: 'http://nnm-club.me/forum/tracker.php',
            scope: '.tablesorter>tbody>tr:matches(.prow1,.prow2)',
            pageSize: 50,
            selectors: {
                id: { selector: '.topictitle', transform: extratId },
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
        return 'nnm'
    }

    getSearchUrl(query) {
        const { searchUrl } = this.config
        return `${searchUrl}?nm=${query}`
    }

    getInfoUrl(resultsId) {
        const { baseUrl } = this.config
        return `${baseUrl}/forum/viewtopic.php?t=${resultsId}`
    }
}

module.exports = NNMClubProvider