import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { ListItemText} from '@material-ui/core'
import { grey } from '@material-ui/core/colors'
import { isPlayable, getTorrentFileContentLink } from '../utils'
import filesize from 'file-size'
import CastOrPlayListItem from './CastOrPlayListItem'

class TorrentListItemFile extends Component {
    handleDownload = () => {
        const { torrent, file } = this.props
        const downloadUrl = getTorrentFileContentLink(torrent.infoHash, file.id)

        window.open(downloadUrl, '_blank')
    }

    render() {
        const { torrent, file, fileIndex, onPlayFile, onCastFile } = this.props

        const playable = isPlayable(file.name)
        const fileProgress = Math.max(file.progress, 0)
        const isReady = fileProgress > 0.99
        const progress = isReady ? '100%' : Math.ceil(Math.min(fileProgress, 1) * 100) + '%'

        const text = <div style={{ wordBreak: 'break-all' }}>
            {file.name}&nbsp;
            <span style={{ color: grey[600] }}>
                {filesize(file.length).human()}&nbsp;{progress}
            </span>
        </div>

        return (
            <CastOrPlayListItem  key={fileIndex} 
                playable={playable} 
                onPlay={() => onPlayFile(torrent, file)}
                onCast={() => onCastFile(torrent, file)}
                secondaryActions={[
                    { title: 'Download', action: this.handleDownload }
                ]} 
            >
                <ListItemText primary={text} />
            </CastOrPlayListItem>
        )
    }
}

TorrentListItemFile.propTypes = {
    torrent: PropTypes.object.isRequired,
    file: PropTypes.object.isRequired,
    fileIndex: PropTypes.number.isRequired,
    onPlayFile: PropTypes.func.isRequired,
    onCastFile: PropTypes.func.isRequired,
}

export default TorrentListItemFile