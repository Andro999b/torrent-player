const { DLNA_TRANSCODING_FLAGS } = require('../../dlna/dlnaFlags')

//DLNA.ORG_PN - profile name(codecs info)
//DLNA.ORG_OP - seaking info (fist num seak by time, seconsd by bytes)
//DLNA.ORG_CI - content converted or not

module.exports = function(clientId) {

    if(clientId == 'vlc-mobile') {
        return {
            dlnaFeatures: `DLNA.ORG_PN=MPEG4_P2_TS_SP_MPEG1_L3_ISO;DLNA.ORG_OP=10;DLNA.ORG_FLAGS=${DLNA_TRANSCODING_FLAGS}`,
            setFFMpegSettings(ffmpegCommand) {
                return ffmpegCommand
                    .videoCodec('mpeg4')
                    .videoBitrate('6000k')
                    .audioCodec('libmp3lame')
            }
        }
    }

    return {
        dlnaFeatures: `DLNA.ORG_PN=AVC_TS_MP_HD_AAC_ISO;DLNA.ORG_OP=10;DLNA.ORG_FLAGS=${DLNA_TRANSCODING_FLAGS}`,
        setFFMpegSettings(ffmpegCommand) {
            return ffmpegCommand
                .videoCodec('libx264')
                .audioCodec('aac')
                .addOutputOption('-tune zerolatency')
                .addOutputOption('-crf 22')
                .fps(25)
        }
    }
}