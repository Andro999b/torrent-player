import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import TorrentListItem from '../components/TorrentListItem'
import DeleteDialog from '../components/DeleteDialog'
import ContinueWatchingItem from '../components/ContinueWatchingItem'

import {
    Grid,
    CircularProgress,
    Typography
} from '@material-ui/core'

import { observer, inject } from 'mobx-react'

const DeleteTorrentDialog = (props) => 
    <DeleteDialog 
        {...props}
        renderTitle={() => 'Delete torrent?'}
        renderText={(item) => `Do you want to delete torrent ${item.name} and all data?`}
    />

@inject('libraryStore', 'transitionStore') 
@observer
class LibraryView extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            torrentToDelete: null
        }
    }

    componentDidMount() {
        this.props.libraryStore.startUpdate()
        // this.props.libraryStore.updateTorrents()
    }

    componentWillUnmount() {
        this.props.libraryStore.stopUpdate()
    }

    handleCleanRecent = (item) => this.props.libraryStore.cleanContinueWatchingItem(item)
    handleAskDeleteToprrent = (torrent) => this.setState({ torrentToDelete: torrent })
    handleRejectDeleteToprrent = () => this.setState({ torrentToDelete: null })
    handleAcceptDeleteToprrent = (torrent) => {
        const { libraryStore } = this.props
        this.setState({ torrentToDelete: null })
        libraryStore.deleteTorrent(torrent)
    }

    renderContinueWatching(continueWatching) {
        if(!continueWatching || continueWatching.length == 0) return

        const {
            transitionStore: {
                playMedia,
                openCastDialog
            }
        } = this.props

        return (
            <Fragment>
                <Typography variant="h6" className="library__title">Continue Watching</Typography>
                {continueWatching.map((item) =>
                    <Grid item xs={12} key={item.playlist.name}>
                        <ContinueWatchingItem item={item} 
                            onPlay={playMedia} 
                            onCast={openCastDialog}
                            onClean={this.handleCleanRecent}
                        />
                    </Grid>
                )}
            </Fragment>
        )
    }

    renderTorrents(torrents) {
        if(!torrents || torrents.length == 0) return

        return (
            <Fragment>
                <Typography variant="h6" className="library__title">Torrents</Typography>
                {torrents.map((torrent) =>
                    <Grid item xs={12} key={torrent.infoHash}>
                        <TorrentListItem torrent={torrent} onDelete={this.handleAskDeleteToprrent.bind(this)} />
                    </Grid>
                )}
            </Fragment>
        )
    }

    render() {
        const { 
            libraryStore: { 
                library: { torrents, continueWatching }, 
                loading 
            }
        } = this.props
        const { torrentToDelete } = this.state

        return (
            <div className="library">
                <Grid container spacing={16}>
                    {loading && <div className="center"><CircularProgress /></div>}
                    {!loading && 
                        <Fragment>
                            {this.renderContinueWatching(continueWatching)}
                            {this.renderTorrents(torrents)}
                        </Fragment>
                    }
                    <DeleteTorrentDialog
                        item={torrentToDelete}
                        onAccept={this.handleAcceptDeleteToprrent.bind(this)}
                        onReject={this.handleRejectDeleteToprrent.bind(this)}
                    />
                </Grid>
            </div>
        )
    }
}

LibraryView.propTypes = {
    libraryStore: PropTypes.object,
    transitionStore: PropTypes.object
}

export default LibraryView