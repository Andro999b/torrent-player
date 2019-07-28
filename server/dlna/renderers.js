const SsdpHeader = require('node-ssdp/lib/ssdpHeader')
const RemoteDevice = require('../service/remote/RemoteDevice')
const MediaRendererClient = require('upnp-mediarenderer-client')
const remote = require('../service/remote')
const debug = require('debug')('dnla-renderer')
const { WEB_PORT, HOSTNAME } = require('../config')
const { getExtractorUrl } = require('../utils')
const { DLNA_ORIGIN_FLAGS, DLNA_TRANSCODING_FLAGS } = require('../dlna/dlnaFlags')

class DLNADevice extends RemoteDevice {
    constructor(client) {
        super()
        this.avaliable = true
        this.client = client

        client.getDeviceDescription((err, description) => {
            if(err) {
                console.error(err)
                this.updateState({ error: 'Device not ready', isLoading: false })
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
        const title = `${currentFileIndex + 1} / ${playlist.files.length}`
        const { transcodedUrl } = source
        
        const transcodingAvaliable = !this.transcodingMode && transcodedUrl

        const targetUrl = this.getVideoUrl(source)

        if(this.lastUrl == targetUrl) {
            this.client.seek(startTime,  () => {
                this.client.play()
            })
            return
        }

        if(!targetUrl) {
            this.updateState({ error: 'Device cant play media', isLoading: false })
            return
        }

        this.lastUrl = targetUrl
        this.seekToPosition = startTime
        this.client.load(targetUrl, {
            autoplay: true,
            contentType: 'video/mpeg',
            metadata: {
                title,
                type: 'video',
                dlnaFeatures: this.transcodingMode ? 
                    `DLNA.ORG_OP=10;DLNA.ORG_FLAGS=${DLNA_TRANSCODING_FLAGS}`:
                    `DLNA.ORG_OP=01;DLNA.ORG_FLAGS=${DLNA_ORIGIN_FLAGS}`
            }
        }, (err) => {
            if(err) {
                if(err.errorCode == 701) { // transition not avalaible
                    return
                }
                if(transcodingAvaliable) {
                    // try swtich to transcoding mode
                    this.transcodingMode = true
                    this.play(startTime)
                } else {
                    this.updateState({ error: 'Device cant play media' })
                    console.error('client.load', err)
                }
            } else {
                this.startTrackState()
            }
        })
    }

    getVideoUrl(source) {
        const { url, downloadUrl, transcodedUrl, extractor } = source

        let targetUrl = this.transcodingMode ? 
            transcodedUrl : 
            (url || downloadUrl)

        if(!targetUrl) {
            return null
        }
        
        
        if(targetUrl.startsWith('/')) {
            targetUrl = `http://${HOSTNAME}:${WEB_PORT}${targetUrl}`
        } else if(extractor) { // add video extractor
            const { type, params } = extractor
            targetUrl = getExtractorUrl(
                targetUrl, 
                {
                    type, 
                    params: {...params, noredirect: '' }
                }
            )
        }

        return targetUrl
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
        this.lastUrl = null
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
            this.trackingId = null
        }
    }

    clearState(emitEvents = true) {
        this.stopTrackState()
        super.clearState(emitEvents)

        this.playlistName = null
        this.transcodingMode = false
        this.lastUrl = null
    }
}

module.exports = (ssdpServer) => {

    const devices = {}
    function addDevice (headers) {
        const usn = headers.USN

        if(!devices[usn]) {
            debug('New dlna device found', headers)

            const client = new MediaRendererClient(headers.LOCATION)
            const device = new DLNADevice(client)

            remote.addDevice(device)
            devices[usn] = device
            
            client.once('error', () => {
                remote.removeDevice(device.id)
                delete devices[usn]
            })
        }
    }

    function removeDevice (headers) {
        const usn = headers.USN

        if(devices[usn]) {
            const device = devices[usn]
            remote.removeDevice(device.id)
            delete devices[usn]
        }
    }

    function search() {
        const header = new SsdpHeader('m-search', {
            'HOST': ssdpServer._ssdpServerHost,
            'ST': 'urn:schemas-upnp-org:device:MediaRenderer:1',
            'MAN': '"ssdp:discover"',
            'MX': 3
        })

        ssdpServer._send(header, (err) => {
            if (err) {
                // eslint-disable-next-line no-console
                console.error(`Error: unable to send M-SEARCH request ID ${header.id()}`, err)
            }
        })
    }

    ssdpServer.on('response', addDevice)
    ssdpServer.on('advertise-bye', removeDevice)

    setInterval(search, 5000)
}