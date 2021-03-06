import React, { Component } from 'react'
import PropTypes from 'prop-types'

import { ListItemText } from '@material-ui/core'
import { grey } from '@material-ui/core/colors'
import { isPlayable } from '../utils'
import { getTorrentFileContentLink, createDownloadSecondaryActions } from '../utils/contextSecondaryActions'
import filesize from 'file-size'
import CastOrPlayListItem from './CastOrPlayListItem'

class TorrentListItemFile extends Component {
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
            <CastOrPlayListItem key={fileIndex}
                playable={playable}
                onPlay={() => onPlayFile(torrent, file)}
                onCast={() => onCastFile(torrent, file)}
                secondaryActions={createDownloadSecondaryActions({
                    url: getTorrentFileContentLink(torrent.infoHash, file.id),
                    name: file.name
                })}
            >
                <ListItemText primary=
                    {<span style={{ wordBreak: 'break-all' }}>
                        {text}
                    </span>}
                />
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