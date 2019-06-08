const UPNPServer = require('./upnp-server/Server')
const { toXML } = require('jstoxml')
const torrentsService = require('../service/torrents')
const { DLNA_PORT, DLNA_NAME , TRANSCODING_ENABLED, DLNA_UUID } = require('../config')
const { mediaResource, containerResource, parseObjetcId, createObjetcId } = require('./dlnaResources')
const getTorrentFs = require('./torrentFs')
const debug = require('debug')('dlna')

async function browseContent(inputs, req) {
    if (inputs.ObjectID == '0') {
        return browseTorrentsList(inputs)
    } else if(inputs.ObjectID == 'original') {
        return browseTorrentsList(inputs, true)
    } else {
        return browseTorrentFs(inputs, req)
    }
}

async function browseMetadata(inputs, req) {
    if (inputs.ObjectID == '0') {
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
        NumberReturned: items.length,
        TotalMatches: torrents.length,
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
        modelName: 'MediaServer',
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

    server.start(() => console.log(`DLNA Server started at port ${DLNA_PORT}, uuid ${DLNA_UUID} `))// eslint-disable-line no-console
}