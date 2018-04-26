const videExtensions = require('../../resources/video-extensions.json')
const audioExtensions = require('../../resources/audio-extensions.json')

function hasOneOfExtensions(extensions, fileName) {
    return extensions.findIndex((ext) => {
        return fileName.endsWith(`.${ext}`)
    }) != -1
}

module.exports = {
    isVideo(fileName){
        return hasOneOfExtensions(videExtensions, fileName)
    },
    isAudio(fileName){
        return hasOneOfExtensions(audioExtensions, fileName)
    }
}