const metadataService = require('./metadata')

const encodingSettings = {
    '480p': {
        videoBitrate: 1216,
        audioBitrate: 64,
        videoSize: '848x480'
    },
    '480pHQ': {
        videoBitrate: 1536,
        audioBitrate: 64,
        videoSize: '848x480'
    },
    '576p': {
        videoBitrate: 1856,
        audioBitrate: 64,
        videoSize: '1024x576'
    },
    '576pHQ': {
        videoBitrate: 2176,
        audioBitrate: 64,
        videoSize: '1024x576'
    },
    '720p': {
        videoBitrate: 2496,
        audioBitrate: 64,
        videoSize: '1280x720'
    },
    '720pHQ': {
        videoBitrate: 3072,
        audioBitrate: 128,
        videoSize: '1280x720'
    },
    '1080p': {
        videoBitrate: 4992,
        audioBitrate: 128,
        videoSize: '1920x1080'
    },
    '1080pHQ': {
        videoBitrate: 7552,
        audioBitrate: 128,
        videoSize: '1920x1080'
    }
}

module.exports = function(metadata) {
    const { height } = metadataService.getVideoStream(metadata)

    if(height > 720) {
        return encodingSettings['1080pHQ']
    }

    if(height > 576) {
        return encodingSettings['720pHQ']
    }

    if(height > 480) {
        return encodingSettings['576pHQ']
    }

    return encodingSettings['480pHQ']
}