const SSDP = require('node-ssdp').Client
const RemoteDevice = require('../service/remote/RemoteDevice')
const MediaRendererClient = require('upnp-mediarenderer-client')
const remote = require('../service/remote')
const ip = require('ip')
const debug = require('debug')('dnla-renderer')
const { WEB_PORT, DLNA_TRANSCODING_FEATURES } = require('../config')

class DLNADevice extends RemoteDevice {
    constructor(client) {
        super()
        this.avaliable = true
        this.client = client

        client.getDeviceDescription((err, description) => {
            if(err) {
                console.error(err)
                this.updateState({ error: 'Device not ready' })
                return
            }
            this.name = description.friendlyName
        })

        client.on('playing', () => {
            this.updateState({
                isPlaying: true,
                isLoading: false
            })

            if(this.seekToPosition) {
                client.seek(this.seekToPosition)
                this.seekToPosition = null
            }

            client.getDuration((_, duration) => {
                this.updateState({ duration })
            })
        })

        // client.on('stopped', () => this.stop())
    }

    play(startTime) {
        const { currentFileIndex, playlist } = this.state
        const source = playlist.files[currentFileIndex]

        const title = `${this.playlistName} - ${currentFileIndex + 1}`

        let targetUrl = this.transcodingMode ? source.transcodedUrl : source.url
        
        if(!targetUrl) {
            this.updateState({ error: 'Device cant play media' })
            return
        }
        
        if(targetUrl.startsWith('/')) {
            targetUrl = `http://${ip.address()}:${WEB_PORT}${targetUrl}`
        }

        this.seekToPosition = startTime
        this.client.load(targetUrl, {
            autoplay: true,
            contentType: 'video/mpeg',
            metadata: {
                title,
                type: 'video',
                dlnaFeatures: DLNA_TRANSCODING_FEATURES
            }
        }, (err) => {
            if(err) {
                if(err.errorCode == 701) { // transition not avalaible
                    return
                }
                if(this.transcodingMode) {
                    this.updateState({ error: 'Device cant play media' })
                    console.error('client.load', err)
                } else {
                    // try swtich to transcoding mode
                    this.transcodingMode = true
                    this.play(startTime)
                }
            } else {
                this.startTrackState()
            }
        })
    }

    resume() {
        this.client.play()
    }

    pause() {
        this.client.pause()
    }

    stop() {
        this.client.stop()
        this.clearState()
    }

    seek(currentTime) {
        this.client.seek(currentTime)
    }

    skip(sec) {
        const { duration, currentTime } = this.state
        if(duration) {
            const seekTime = currentTime + sec
            this.seek(Math.min(Math.max(seekTime, 0), duration))
        }
    }

    playNext() {
        const { playlist: { files }, currentFileIndex } = this.state
        
        const nextFile = currentFileIndex + 1
        if(nextFile < files.lenth) {
            this.updateState({ isPlaying: false })
        } else {
            this.selectFile(nextFile)
        }
    }

    selectFile(fileIndex) {
        this.updateState({ currentFileIndex: fileIndex })
        this.play()
    }

    setPlaylist(playlist, fileIndex, currentTime) {
        this.playlistName = playlist.name
        this.transcodingMode = false
        this.updateState({
            currentFileIndex: fileIndex,
            currentTime,
            duration: 0,
            isPlaying: false,
            isLoading: true,
            error: null,
            volume: 1,
            playlist
        })
        this.play(currentTime)
    }

    doAction(action, payload) {
        switch(action) {
            case 'pause': this.pause(); break
            case 'resume': this.resume(); break
            case 'play': this.play(payload); break
            case 'seek': this.seek(payload); break
            case 'skip': this.seek(payload); break
            case 'setVolume': break
            case 'selectFile': this.selectFile(payload); break
            case 'toggleMute': break
            case 'openPlaylist': {
                const { playlist, fileIndex, startTime } = payload
                this.setPlaylist(playlist, fileIndex, startTime)
                break
            }
            case 'closePlaylist': this.stop(); break
        }
    }

    destroy() {
        this.stopTrackState()
    }

    startTrackState() {
        this.stopTrackState()
        this.trackingId = setInterval(() => {
            const { client } = this
            const { isLoading, isPlaying } = this.state
            if(isLoading) return

            client.getTransportInfo((err, result) => {
                if(err) {
                    console.error(err)
                    this.clearState()
                    return
                }

                switch(result.CurrentTransportState) {
                    case 'STOPPED':
                        this.playNext()
                        break
                    case 'PLAYING':
                        if(isPlaying) return
                        this.updateState({ isPlaying: true })
                        break
                    case 'PAUSED_PLAYBACK':
                        if(!isPlaying) return
                        this.updateState({ isPlaying: false })
                        break
                }
            })

            client.getPosition((err, currentTime) => {
                if(err) {
                    console.error('getPosition', err)
                    return
                }

                this.updateState({ currentTime })
            })
        }, 1000)
    }

    stopTrackState() {
        if(this.trackingId) {
            clearInterval(this.trackingId)
        }
    }

    clearState(emitEvents = true) {
        this.stopTrackState()
        super.clearState(emitEvents)
    }
}

module.exports = () => {
    const devices = {}
    const ssdpClient = new SSDP()

    ssdpClient.on('response', (headers) => {
        // console.log(headers, statusCode, rinfo)

        const usn = headers.USN

        if(!devices[usn]) {
            debug('New dlna device found', headers)
            const device = new DLNADevice(new MediaRendererClient(headers.LOCATION))
            devices[usn] = device
            remote.addDevice(device)
        }
    })

    ssdpClient.search('urn:schemas-upnp-org:device:MediaRenderer:1')

    setInterval(() => {
        ssdpClient.search('urn:schemas-upnp-org:device:MediaRenderer:1')
    }, 5000)
}