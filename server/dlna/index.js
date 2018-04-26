const upnp = require('peer-upnp')
const uuid = require('node-uuid')
const mime = require('mime-types')
const http = require('http')
const ip = require('ip')
const { toXML } = require('jstoxml')
const torrentsService = require('../service/torrents')
const { isVideo, isAudio } = require('../utils')
const { DLNA_PORT, WEB_PORT } = require('../config')
const debug = require('debug')('dlna')

const server = http.createServer()

function browseContent(inputs) {
    if (inputs.ObjectID == '0') {
        return browseTorrentsList(inputs)
    } else {
        return browseTorrentFiles(inputs)
    }
}

function browseTorrentsList(inputs) { // eslint-disable-line no-unused-vars
    const begin = parseInt(inputs.StartingIndex)
    const end = begin + parseInt(inputs.RequestedCount)
    const torrents = torrentsService.getTorrents()
    const sliced = torrents.slice(begin, end)

    const didl = toDIDL(
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

function browseTorrentFiles(inputs) {
    const id = inputs.ObjectID
    const torrent = torrentsService.getTorrent(id)

    const begin = parseInt(inputs.StartingIndex)
    const end = begin + parseInt(inputs.RequestedCount)
    const sliced = torrent.files.slice(begin, end)

    const didl = toDIDL(
        sliced
            .map((file, id) => ({
                id: id,
                infoHash: torrent.infoHash,
                title: file.name,
                path: file.path
            }))
            .map(toDIDLItem)
    )

    return {
        Result: didl,
        NumberReturned: sliced.length,
        TotalMatches: torrent.files.length,
        UpdateID: 0
    }
}

function browseMetadata(inputs) { // eslint-disable-line no-unused-vars
    const id = inputs.ObjectID
    const parts = id.split(':')
    const torrentId = parts[0]
    const fileIndex = parts[1]

    const file = torrentsService.getTorrent(torrentId).files[fileIndex]
    const didl = toDIDL([
        toDIDLItem({
            id: fileIndex,
            infoHash: torrentId,
            title: file.name,
            path: file.path
        })
    ])

    return {
        Result: didl,
        NumberReturned: 1,
        TotalMatches: 1,
        UpdateID: 0
    }
}

function toDIDLContainer(item) {
    return {
        _name: 'container',
        _attrs: {
            id: `${item.id}`,
            parentID: `${item.infoHash}`,
            childCount: `${item.count}`,
            restricted: '1'
        },
        _content: {
            'dc:title': item.title,
            'upnp:class': 'object.container.storageFolder'
        }
    }
}

function toDIDLItem(item) {
    const upnpClass = getItemClass(item)

    const content = [
        { 'dc:title': item.title },
        { 'upnp:class': upnpClass },
        {
            _name: 'res',
            _attrs: {
                'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
                'protocolInfo': `http-get:*:${mime.lookup(item.path)}:*`,
                'size': -1
            },
            _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${item.infoHash}/files/${item.id}`
        }
    ]

    if(upnpClass == 'object.item.videoItem') {
        const attrs = {
            'xmlns:dlna': 'urn:schemas-dlna-org:metadata-1-0/',
            'protocolInfo': 'http-get:*:video/mpegts:*',
            'size': -1
        }

        content.push({
            _name: 'res',
            _attrs: attrs,
            _content: `http://${ip.address()}:${WEB_PORT}/api/torrents/${item.infoHash}/files/${item.id}/transcoded`
        })
    }

    return {
        _name: 'item',
        _attrs: {
            id: `${item.infoHash}:${item.id}`,
            parentID: `${item.infoHash}`,
            restricted: '1'
        },
        _content: content
    }
}

function toDIDL(content) {
    return toXML(
        {
            _name: 'DIDL-Lite',
            _attrs: {
                'xmlns': 'urn:schemas-upnp-org:metadata-1-0/DIDL-Lite/',
                'xmlns:dc': 'http://purl.org/dc/elements/1.1/',
                'xmlns:upnp': 'urn:schemas-upnp-org:metadata-1-0/upnp/',
                'xmlns:pv': 'http://www.pv.com/pvns/',
                'xmlns:sec': 'http://www.sec.co.kr/'
            },
            _content: content
        }
    )
}

function getItemClass(item) {
    if (isVideo(item.path))
        return 'object.item.videoItem'
    if (isAudio(item.path))
        return 'object.item.audioItem'
    return 'object.item'
}


module.exports = function () {
    server.listen(DLNA_PORT)

    // Create a UPnP Peer. 
    const peer = upnp.createPeer({
        prefix: '/dlna',
        server: server
    }).on('ready', function () {
        // eslint-disable-next-line no-console
        console.log(`DNLA Server started at port ${DLNA_PORT}`)
        // advertise device after peer is ready
        device.advertise()
    }).start()

    const device = peer.createDevice({
        autoAdvertise: false,
        uuid: uuid(),
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
        serialNumber: '1234-1234-1234-1234'
    })

    device.createService({
        domain: 'schemas-upnp-org',
        type: 'ContentDirectory',
        version: '1',
        // Service Implementation
        implementation: {
            Browse(inputs) {
                debug('Browse', inputs)
                try {
                    let res
                    switch (inputs.BrowseFlag) {
                        case 'BrowseDirectChildren': res = browseContent(inputs); break
                        case 'BrowseMetadata': res = browseMetadata(inputs); break
                    }
                    debug(res)
                    return res
                } catch (e) {
                    debug(e)
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
}