const SSDP = require('node-ssdp').Client
const RemoteDevice = require('../service/remote/RemoteDevice')
//const remote = require('../service/remote')

class DLNADevice extends RemoteDevice {
    constructor(player) {
        super()
        this.id = player.xml
        this.player = player
        this.avaliable = true
        this.name = player.name   
    }

    play(currentTime) {
        const { currentFileIndex, playlist } = this.state
        const source = playlist.files[currentFileIndex]

        let url, title = `${this.playlistName} - ${source.name}`
        if (
            (source.mimeType && source.mimeType == 'video/mp4') ||
            source.name.endsWith('mp4')
        ) {
            url = source.url
        } else if (source.transcodedUrl) {
            url = source.transcodedUrl
        } else {
            url = source.url
        }
    }
    
    resume() {
        this.player.resume()
    }

    pause() {
        this.player.pause()
    }
    
    seek(currentTime) {
        this.player.seek(currentTime)
    }

    selectFile(fileIndex) {
        this.updateState({ currentFileIndex: fileIndex })
    }

    setPlaylist(playlist, fileIndex) {
        this.playlist = playlist
        this.playlistName = playlist.name
        this.updateState({ 
            currentFileIndex: 0,
            currentTime: 0,
            duration: 0,
            isPlaying: false,
            isLoading: true,
            error: null,
            volume: 1,
            playlist 
        })
        this.selectFile(fileIndex)
    } 

    doAction(action, payload) {
        switch(action) {
            case 'pause': this.pause(); break
            case 'resume': this.resume(); break
            case 'play': this.play(payload); break
            case 'seek': this.seek(payload); break
            case 'setVolume': break 
            case 'selectFile': this.selectFile(payload); break
            case 'toggleMute': break 
            case 'openPlaylist': {
                const { playlist, fileIndex } = payload
                this.setPlaylist(playlist, fileIndex)
                break
            }
            case 'closePlaylist': break 
        }
    }
}

module.exports = () => {
    const ssdpClient = new SSDP()

    ssdpClient.on('response', (headers, statusCode, rinfo) => {
        console.log(headers, statusCode, rinfo)
    })

    // setInterval(() => {
    //     ssdpClient.search('urn:schemas-upnp-org:device:MediaRenderer:1')
    // }, 1000)
}