const UPNPServer = require('./upnp-server/Server')
const { toXML } = require('jstoxml')
const torrentsService = require('../service/torrents')
const { DLNA_PORT, DLNA_NAME , TRANSCODING_ENABLED, DLNA_UUID } = require('../config')
const { mediaResource, containerResource, parseObjetcId, createObjetcId } = require('./dlnaResources')
const getTorrentFs = require('./torrentFs')
const debug = require('debug')('dlna')

async function browseContent(inputs, req) {
    if (inputs.ObjectID == '0' || !inputs.ObjectID) {
        return browseTorrentsList(inputs)
    } else if(inputs.ObjectID == 'original') {
        return browseTorrentsList(inputs, true)
    } else {
        return browseTorrentFs(inputs, req)
    }
}

async function browseMetadata(inputs, req) {
    if (inputs.ObjectID == '0' || !inputs.ObjectID) {
        return browseRootMetadata()
    } else if(inputs.ObjectID == 'original') {
        return browseRootMetadata('original')
    } else {
        return browseFSEntyMetadata(inputs.ObjectID, req)
    }
}

function browseTorrentsList(inputs, originalOnly = false) {
    const torrents = torrentsService.getTorrents()
    const items = getItemsInRange(inputs, torrents)

    const toContainer = (torrent, type) => ({
        id: createObjetcId({ type, infoHash: torrent.infoHash }),
        title: torrent.name
    })
    const toOriganContainer = (torrent) => toContainer(torrent, 'original')
    const toTranscodedContainer = (torrent) => toContainer(torrent, 'transcode')

    let containers = []
    if(TRANSCODING_ENABLED && originalOnly == false) {
        containers = items.map(toTranscodedContainer)
        containers.push({
            id: createObjetcId({ type: 'original' }),
            title: 'Original Files'
        })
    } else {
        containers = items.map(toOriganContainer)
    }

    return {
        Result: toDIDLXml(containers.map(containerResource)),
        NumberReturned: containers.length,
        TotalMatches: containers.length,
        UpdateID: 0
    }
}

async function browseTorrentFs(inputs, req) {
    const parentId = inputs.ObjectID
    const { type, infoHash, torrentFsId } = parseObjetcId(inputs.ObjectID)

    const torrent = torrentsService.getTorrent(infoHash)
    const torrentFs = getTorrentFs(torrent)
    const fsEntry = torrentFs.getById(torrentFsId)

    if(fsEntry.type == 'dir') {
        const children = getItemsInRange(inputs, fsEntry.children)
        const didl = await Promise.all(children.map(async (child) => {
            const id = createObjetcId({ type, infoHash, torrentFsId: child.id })
            if(child.type == 'file') {
                return await mediaResource({ id, parentId, fsEntry: child, clientId: getClientId(req) })
            } else {
                return containerResource({ id, parentId, title: child.title })
            }
        }))

        return {
            Result: toDIDLXml(didl),
            NumberReturned: children.length,
            TotalMatches: fsEntry.count,
            UpdateID: 0
        }
    } else {
        throw Error('FS entry is not container')
    }
}

function browseRootMetadata(id = '0') {
    return {
        Result: toDIDLXml([containerResource({
            id,
            parentId: '0',
            title: DLNA_NAME
        })]),
        NumberReturned: 1,
        TotalMatches: 1,
        UpdateID: 0
    }
}

async function browseFSEntyMetadata(resId, req) {
    const { type, infoHash, torrentFsId } = parseObjetcId(resId)

    const torrent = torrentsService.getTorrent(infoHash)
    const torrentFs = getTorrentFs(torrent)
    const fsEntry = torrentFs.getById(torrentFsId)

    const id = createObjetcId({ type, infoHash, torrentFsId: fsEntry.id })
    const parentId = createObjetcId({ type, infoHash, torrentFsId: fsEntry.parentId })

    let didl
    if(fsEntry.type == 'file') {
        didl = await mediaResource({ id, parentId, fsEntry: fsEntry, clientId: getClientId(req), readMetadata: true })
    } else {
        didl = containerResource({ id, parentId, title: fsEntry.title })
    }

    return {
        Result: toDIDLXml([didl]),
        NumberReturned: 1,
        TotalMatches: 1,
        UpdateID: 0
    }
}

function getItemsInRange(inputs, items) {
    const begin = parseInt(inputs.StartingIndex)
    const end = begin + parseInt(inputs.RequestedCount)
    return end > begin ? items.slice(begin, end) : items
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

function getClientId(req) {
    const userAgent = req.headers['user-agent']

    if(userAgent) {
        if(userAgent.includes('PlayStation'))
            return 'ps'

        if(userAgent.includes('Portable SDK for UPnP devices'))
            return 'vlc-mobile'
    }

    return req.client.remoteAddress
}

module.exports = function () {
    // Create a UPnP Peer.
    const server = new UPNPServer({
        prefix: '/dlna',
        port: DLNA_PORT
    })

    const device = server.createDevice({
        uuid: DLNA_UUID,
        productName: DLNA_NAME,
        productVersion: '0.0.1',
        domain: 'schemas-upnp-org',
        type: 'MediaServer',
        version: '1',
        friendlyName: DLNA_NAME,
        modelName: 'Torrents',
        modelDescription: 'Torrents',
        modelUrl: 'https://github.com/Andro999b/torrent-player',
        manufacturer: 'andro999b',
        modelNumber: '0.0.1',
    })

    device.createService({
        domain: 'schemas-upnp-org',
        type: 'ContentDirectory',
        version: '1',
        // Service Implementation
        implementation: {
            async Browse(inputs, req) {
                let res
                try{
                    switch (inputs.BrowseFlag) {
                        case 'BrowseDirectChildren': res = await browseContent(inputs, req); break
                        case 'BrowseMetadata': res = await browseMetadata(inputs, req); break
                    }
                    // console.log(inputs, res);
                    return res
                }catch (e) {
                    console.error('DLNA Action fail inputs:', inputs, 'output:', res, 'error:', e)
                    throw e
                }
            },
            GetSortCapabilities() {
                return { SortCaps: '' }
            },
            GetSearchCapabilities() {
                return { SearchCaps: '' }
            },
            GetSystemUpdateID() {
                return { id: 0 }
            },
            X_SetBookmark() {
                return null
            },
            X_GetFeatureList() {
                return {
                    FeatureList:  toXML({
                        _name: 'Features',
                        _attrs: {
                            'xmlns': 'urn:schemas-upnp-org:av:avs',
                            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                            'xsi:schemaLocation': 'urn:schemas-upnp-org:av:avs http://www.upnp.org/schemas/av/avs.xsd'
                        },
                        _content: {
                            _name: 'Feature',
                            _attrs: {
                                name: 'samsung.com_BASICVIEW'
                            },
                            _content: 
                                ['object.item.audioItem', 'object.item.videoItem', 'object.item.imageItem']
                                    .map((type) => ({
                                        _name: 'container',
                                        _attrs: { id: '0', type }
                                    }))
                        }
                    })
                }
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
                },
                GetSearchCapabilities: {
                    outputs: {
                        SearchCaps: 'SearchCapabilities'
                    }
                },
                GetSystemUpdateID: {
                    outputs: {
                        id: 'SystemUpdateID',
                    }
                }
            },
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
                A_ARG_TYPE_SearchCriteria: 'string',
                A_ARG_TYPE_Result: 'string',
                A_ARG_TYPE_UpdateID: 'ui4',
                SortCapabilities: 'string',
                SearchCapabilities: 'string',
                SystemUpdateID: {
                    type: 'ui4',
                    event: true,
                    defaultValue: 0
                }
            }
        }
    })

    device.createService({
        domain: 'schemas-upnp-org',
        type: 'ConnectionManager',
        version: '1',
        // Service Implementation
        implementation: {
            GetCurrentConnectionInfo() {
                return {
                    CurrentConnectionIDs: []
                }
            },
            GetCurrentConnectionIDs()  {
                return null
            },
            GetProtocolInfo()  {
                return {
                    Source: '',
                    Sink: ''
                }
            }
        },
        // Service Description. this will be converted to XML
        description: {
            actions: {
                GetCurrentConnectionInfo: {
                    outputs: {
                        ConnectionIDs: 'CurrentConnectionIDs'
                    }
                },
                GetCurrentConnectionIDs: {
                    inputs: {
                        ConnectionID: 'A_ARG_TYPE_ConnectionID'
                    },
                    outputs: {
                        RcsID: 'A_ARG_TYPE_RcsID',
                        AVTransportID: 'A_ARG_TYPE_AVTransportID',
                        ProtocolInfo: 'A_ARG_TYPE_ProtocolInfo',
                        PeerConnectionManager: 'A_ARG_TYPE_ConnectionManager',
                        PeerConnectionID: 'A_ARG_TYPE_ConnectionID',
                        Direction: 'A_ARG_TYPE_Direction',
                        Status: 'A_ARG_TYPE_ConnectionStatus',
                    }
                },
                GetProtocolInfo: {
                    outputs: {
                        Source: 'SourceProtocolInfo',
                        Sink: 'SinkProtocolInfo'
                    }
                }
            },
            variables: {
                A_ARG_TYPE_ConnectionStatus: {
                    type: 'string',
                    enum: ['OK', 'ContentFormatMismatch', 'InsufficientBandwidth', 'UnreliableChannel', 'Unknown']
                },
                A_ARG_TYPE_ConnectionID: 'i4',
                A_ARG_TYPE_AVTransportID: 'i4',
                A_ARG_TYPE_Direction: {
                    type: 'string',
                    enum: ['Input', 'Output']
                },
                A_ARG_TYPE_RcsID: 'string',
                A_ARG_TYPE_ProtocolInfo: 'string',
                A_ARG_TYPE_ConnectionManager: 'string',
                SourceProtocolInfo: {
                    type: 'string',
                    event: true
                },
                SinkProtocolInfo: {
                    type: 'string',
                    event: true
                },
                CurrentConnectionIDs: {
                    type: 'string',
                    event: true
                }
            }
        }
    })

    server.start(() => console.log(`DLNA Server started at port ${DLNA_PORT}, uuid ${DLNA_UUID} `))// eslint-disable-line no-console
}