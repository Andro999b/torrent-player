/* 
DLNA_FLAGS_SENDER_PACED               Content source is the clock source during transport
DLNA_FLAGS_TIME_BASED_SEEK            Limited Operation: time-seek supported
DLNA_FLAGS_BYTE_BASED_SEEK            Limited Operation: byte-seek supported
DLNA_FLAGS_PLAY_CONTAINER             Resource supports 'Container Playback'
DLNA_FLAGS_S0_INCREASE                Content does not have a fixed beginning
DLNA_FLAGS_SN_INCREASE                Content does not have a fixed end
DLNA_FLAGS_RTSP_PAUSE                 RTSP resource supports pausing of media transfer
DLNA_FLAGS_STREAMING_TRANSFER_MODE    Streaming transfer mode supported
DLNA_FLAGS_INTERACTIVE_TRANSFER_MODE  Interactive transfer mode supported
DLNA_FLAGS_BACKGROUND_TRANSFER_MODE   Background transfer mode supported
DLNA_FLAGS_CONNECTION_STALL           No content transfer when paused.
DLNA_FLAGS_DLNA_V15                   DLNAv1.5 version flag 
 */


/* eslint-disable no-unused-vars*/
const DLNA_ORG_FLAG_SENDER_PACED               = (1 << 31)
const DLNA_ORG_FLAG_TIME_BASED_SEEK            = (1 << 30)
const DLNA_ORG_FLAG_BYTE_BASED_SEEK            = (1 << 29)
const DLNA_ORG_FLAG_PLAY_CONTAINER             = (1 << 28)
const DLNA_ORG_FLAG_S0_INCREASE                = (1 << 27)
const DLNA_ORG_FLAG_SN_INCREASE                = (1 << 26)
const DLNA_ORG_FLAG_RTSP_PAUSE                 = (1 << 25)
const DLNA_ORG_FLAG_STREAMING_TRANSFER_MODE    = (1 << 24)
const DLNA_ORG_FLAG_INTERACTIVE_TRANSFERT_MODE = (1 << 23)
const DLNA_ORG_FLAG_BACKGROUND_TRANSFERT_MODE  = (1 << 22)
const DLNA_ORG_FLAG_CONNECTION_STALL           = (1 << 21)
const DLNA_ORG_FLAG_DLNA_V15                   = (1 << 20)
/* eslint-enable */

function toDLNAFlagString(flags) {
    return flags.toString(16) + '000000000000000000000000'
}

module.exports = {
    DLNA_TRANSCODING_FLAGS: toDLNAFlagString(DLNA_ORG_FLAG_DLNA_V15 | DLNA_ORG_FLAG_TIME_BASED_SEEK | DLNA_ORG_FLAG_STREAMING_TRANSFER_MODE),
    DLNA_ORIGIN_FLAGS: toDLNAFlagString(DLNA_ORG_FLAG_DLNA_V15 | DLNA_ORG_FLAG_BYTE_BASED_SEEK | DLNA_ORG_FLAG_INTERACTIVE_TRANSFERT_MODE)
}