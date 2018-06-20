const uuid = require('uuid')
const UPNPServer = require('./upnp-server/Server')
const { toXML } = require('jstoxml')
const torrentsService = require('../service/torrents')
const { DLNA_PORT } = require('../config')
const getMediaResource = require('./resources')
const debug = require('debug')('dlna')

function getClientId(req) {
    const userAgent = req.headers['user-agent']

    if(userAgent && userAgent.includes('PlayStation'))
        return 'ps'

    return uuid()
}

function browseContent(inputs, req) {
    if (inputs.ObjectID == '0') {
        return browseTorrentsList(inputs)
    } else {
        return browseTorrentFiles(inputs, req)
    }
}

function browseTorrentsList(inputs) { // eslint-disable-line no-unused-vars
    const begin = parseInt(inputs.StartingIndex)
    const end = begin + parseInt(inputs.RequestedCount)
    const torrents = torrentsService.getTorrents()
    const sliced = torrents.slice(begin, end)

    const didl = toDIDLXml(
        sliced
            .map((tor) => ({
                id: tor.infoHash,
                title: tor.name,
                count: tor.files.length
            }))
            .map(toDIDLContainer)
    )

    return {
        Result: didl,
        NumberReturned: sliced.length,
        TotalMatches: torrents.length,
        UpdateID: 0
    }
}

function browseTorrentFiles(inputs, req) {
    const id = inputs.ObjectID
    const torrent = torrentsService.getTorrent(id)

    const begin = parseInt(inputs.StartingIndex)
    const end = begin + parseInt(inputs.RequestedCount)
    const sliced = torrent.files.slice(begin, end)

    return Promise.all(
        sliced.map((file, index) => getMediaResource(torrent.infoHash, index, file, getClientId(req))))
        .then((didls) => ({
            Result: toDIDLXml(didls),
            NumberReturned: didls.length,
            TotalMatches: torrent.files.length,
            UpdateID: 0
        }))
}

function browseMetadata(inputs) { 
    const id = inputs.ObjectID
    const parts = id.split(':')
    const infoHash = parts[0]
    const fileIndex = parts[1]

    const file = torrentsService.getTorrent(infoHash).files[fileIndex]

    return getMediaResource(infoHash, fileIndex, file)
        .then((didl) => ({
            Result: toDIDLXml([didl]),
            NumberReturned: 1,
            TotalMatches: 1,
            UpdateID: 0
        }))
}

function toDIDLContainer(item) {
    return {
        _name: 'container',
        _attrs: {
            id: `${item.id}`,
            parentID: '0',
            childCount: `${item.count}`,
            restricted: '1'
        },
        _content: {
            'dc:title': item.title,
            'upnp:class': 'object.container.storageFolder'
        }
    }
}

function toDIDLXml(content) {
    const didl = toXML({
        _name: 'DIDL-Lite',
        _attrs: {
            'xmlns': 'urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/',
            'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
            'xmlns:upnp': 'urn:schemas-upnp-org:metadata-1-0/upnp/',
            'xmlns:pv': 'http://www.pv.com/pvns/',
            'xmlns:sec': 'http://www.sec.co.kr/'
        },
        _content: content
    })
    debug(didl)
    return didl
}

module.exports = function () {
    // Create a UPnP Peer. 
    const server = new UPNPServer({
        prefix: '/dlna',
        port: DLNA_PORT
    })

    const device = server.createDevice({
        uuid: 1,//uuid(),
        productName: 'Torrents',
        productVersion: '0.0.1',
        domain: 'schemas-upnp-org',
        type: 'MediaServer',
        version: '1',
        friendlyName: 'Torrents',
        manufacturer: 'andro999b',
        modelName: 'Torrents',
        modelDescription: 'Torrents',
        modelNumber: '0.0.1',
    })

    device.createService({
        domain: 'schemas-upnp-org',
        type: 'ContentDirectory',
        version: '1',
        // Service Implementation
        implementation: {
            Browse(inputs, req) {
                try {
                    let res
                    switch (inputs.BrowseFlag) {
                        case 'BrowseDirectChildren': res = browseContent(inputs, req); break
                        case 'BrowseMetadata': res = browseMetadata(inputs); break
                    }
                    return res
                } catch (e) {
                    throw e
                }
            },
            GetSortCapabilities() { // eslint-disable-line no-unused-vars
                //console.log('GetSortCapabilities', inputs)
                return { SortCaps: '' }
            }
        },
        // Service Description. this will be converted to XML 
        description: {
            actions: {
                Browse: {
                    inputs: {
                        ObjectID: 'A_ARG_TYPE_ObjectID',
                        BrowseFlag: 'A_ARG_TYPE_BrowseFlag',
                        Filter: 'A_ARG_TYPE_Filter',
                        StartingIndex: 'A_ARG_TYPE_Index',
                        RequestedCount: 'A_ARG_TYPE_Count',
                        SortCriteria: 'A_ARG_TYPE_SortCriteria'
                    },
                    outputs: {
                        Result: 'A_ARG_TYPE_Result',
                        NumberReturned: 'A_ARG_TYPE_Count',
                        TotalMatches: 'A_ARG_TYPE_Count',
                        UpdateID: 'A_ARG_TYPE_UpdateID'
                    }
                },
                GetSortCapabilities: {
                    outputs: {
                        SortCaps: 'SortCapabilities'
                    }
                }
            },
            // declare all state variables: key is the name of the variable and value is the type of the variable. 
            // type can be JSON object in this form {type: "boolean"}. 
            variables: {
                A_ARG_TYPE_ObjectID: 'string',
                A_ARG_TYPE_BrowseFlag: {
                    type: 'string',
                    enum: ['BrowseMetadata', 'BrowseDirectChildren']
                },
                A_ARG_TYPE_Filter: 'string',
                A_ARG_TYPE_Index: 'ui4',
                A_ARG_TYPE_Count: 'ui4',
                A_ARG_TYPE_SortCriteria: 'string',
                A_ARG_TYPE_Result: 'string',
                A_ARG_TYPE_UpdateID: 'ui4',
                SortCapabilities: 'string'
            }
        }
    })

    server.start(() => console.log(`DLNA Server started at port ${DLNA_PORT}`))// eslint-disable-line no-console
    process.on('exit', () => server.stop())
}