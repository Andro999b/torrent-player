import { Component } from 'react'
import { reaction } from 'mobx'
import { observer } from 'mobx-react'

import PropTypes from 'prop-types'
import { invokeAll } from '../utils'

/* global MusicControls */

@observer
class MobileMediaControls extends Component {
    listenEvents = (actionStr) => {
        const action = JSON.parse(actionStr)
        const message = action.message

        const { playerStore, transitionStore } = this.props

        switch(message) {
            case 'music-controls-next':
                playerStore.nextFile()
                break
            case 'music-controls-previous':
                playerStore.prevFile()
                break
            case 'music-controls-pause':
                playerStore.device.pause()
                break
            case 'music-controls-play':
                playerStore.device.resume()
                break
            case 'music-controls-destroy':
                transitionStore.stopPlayMedia()
                break

            // External controls (iOS only)
            case 'music-controls-toggle-play-pause' :
                // Do something
                break
            case 'music-controls-seek-to': {
                playerStore.device.seek(action.position)
                break
            }
     
            // Headset events (Android only)
            // All media button events are listed below
            case 'music-controls-media-button' :
                // Do something
                break
            default:
                break
        }
    }

    componentDidMount() {
        const { playerStore: { device } } = this.props

        this.disposeReactions = invokeAll(
            reaction(
                () => device.isPlaying,
                this.updateIsPlaying.bind(this)
            ),
            reaction(
                () => device.currentTime,
                this.updateElapsed.bind(this)
            ),
            reaction(
                () => device.currentFileIndex,
                this.update.bind(this)
            )
        )

        MusicControls.subscribe(this.listenEvents.bind(this))
        MusicControls.listen()
        this.update()
    }

    updateIsPlaying() {
        const { playerStore: { device: { isPlaying }}} = this.props
        MusicControls.updateIsPlaying(isPlaying)
    }

    updateElapsed() {
        const { playerStore: { device: { currentTime, isPlaying }}} = this.props

        MusicControls.updateElapsed({
            elapsed: currentTime,
            isPlaying
        })
    }

    update() {
        const { playerStore } = this.props
        const { device } = playerStore
        const { playlist: { name, files, image }, currentFileIndex, currentTime, duration } = device
        const hasNext = currentFileIndex < files.length - 1
        const hasPrev = currentFileIndex > 0
        const fileName = `${currentFileIndex + 1} - ${files[currentFileIndex].name}`

        MusicControls.create({
            track: fileName,
            artist: name,
            cover: image,
            hasNext,
            hasPrev,
            duration, 
            elapsed: currentTime, 
            hasClose: true,
            hasSkipForward: true,
            hasSkipBackward: true,
            skipForwardInterval: 10,
            skipBackwardInterval: 10
        })
    }

    componentWillUnmount() {
        this.disposeReactions()
        MusicControls.destroy()
    }

    render() {
        return null
    }
}

MobileMediaControls.propTypes = {
    playerStore: PropTypes.object,
    transitionStore: PropTypes.object
}

export default MobileMediaControls