const metadataService = require('../service/metadata')

function isMpeg1Video(video) { 
    return video.codec_name == 'mpeg1video' 
}

function isMpeg2Video(video) { 
    return video.codec_name == 'mpeg2video' 
}

function isMpeg4p2Video(video) { 
    return video.codec_name == 'mpeg4'
}

function isMpeg4p10Video(video) { 
    return video.codec_name == 'h264'
}

function getMpeg1VideoPN() {
    return ['MPEG1', 'video/mpeg']
}

function isFPS(video, testFps) {
    const [ a, b ] = video.r_frame_rate.split('/')
    const fps = Math.floor((parseInt(a) / parseInt(b)) * 100) / 100

    return fps == testFps
}

function getMpeg2VideoPN(video, format) {
    let pn = 'MPEG_'
    let ct = 'video/mpeg'
    let stream_type

    switch(format.format_name) {
        case 'avi': {stream_type = 'PS'; ct = 'video/x-msvideo'; break }
        case 'mpeg': { stream_type = 'PS'; ct = 'video/mpeg'; break }
        case 'mpegts': { stream_type = 'TS'; ct = 'video/mpeg'; break }
        case 'mpegvideo': { stream_type = 'PS'; ct = 'video/mpeg'; break }
        case 'matroska': { stream_type = 'PS'; ct = 'video/x-matroska'; break }
        case 'webm': { stream_type = 'PS'; ct = 'video/webm '; break }
        default: return []
    }

    pn += '_' + stream_type

    if(stream_type == 'PS') {
        if(isFPS(video, 29.97)) {
            pn += '_NTSC'
        } else {
            pn += '_PAL'
        }
    } else {
        if(video.witdh <= 720) {
            pn += '_SD'
        } else {
            pn += '_HD'
        }

        if(isFPS(video, 25)) {
            pn += '_EU'
        } else {
            pn += '_NA'
        }

        pn += '_ISO'
    }

    return [pn, ct]
}

function getMpeg4p2VideoPN(video, audio) {
    let pn = 'MPEG4_P2_MP4'

    switch(video.profile) {
        case 'Simple Profile': { pn += '_SP'; break }
        case 'Advanced Simple Profile': { pn += '_ASP'; break }
        default: return []
    }

    switch(audio.codec_name) {
        case 'acc': { pn += '_ACC'; break }
        case 'ac3': { pn += '_AC3'; break }
        case 'mp3': { pn += '_MPEG1_L3'; break }
        case 'mp2': { pn += '_MPEG2_L2'; break }
        default: return []
    }

    return [pn]
}

function getMpeg4p10VideoPN(video, audio) {
    let pn = 'AVC_MP'

    switch(video.profile) {
        case 'Main': { pn += '_MP'; break }
        case 'Baseline': { pn += '_BL'; break }
        case 'High': { pn += '_HP'; break }
    }

    if(video.witdh <= 720) {
        pn += '_SD'
    } else {
        pn += '_HD'
    }

    switch(audio.codec_name) {
        case 'acc': { pn += '_ACC'; break }
        case 'ac3': { pn += '_AC3'; break }
        case 'mp3': { pn += '_MPEG1_L3'; break }
        default: return []
    }

    return [pn]
}

module.exports = async function(file) {
    const { video, audio, format } = await metadataService.getCodecs(file)

    if(isMpeg4p10Video(video))
        return getMpeg4p10VideoPN(video, audio)

    if(isMpeg4p2Video(video))
        return getMpeg4p2VideoPN(video, audio)

    if(isMpeg2Video(video))
        return getMpeg2VideoPN(video, format)

    if(isMpeg1Video(video))
        return getMpeg1VideoPN()

    return []
}