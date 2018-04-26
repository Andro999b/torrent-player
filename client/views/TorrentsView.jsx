import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Grid from 'material-ui/Grid'
import TorrentListItem from '../components/TorrentListItem'
import DeleteTorrentDialog from '../components/DeleteTorrentDialog'
import Typography from 'material-ui/Typography'
import { CircularProgress } from 'material-ui/Progress'
import { observer, inject } from 'mobx-react'

@inject('torrentsStore') @observer
class TorrentsView extends Component {

    constructor(props, context) {
        super(props, context)

        this.state = {
            torrentToDelete: null
        }
    }

    componentDidMount() {
        this.props.torrentsStore.startUpdate()
        //this.props.torrentsStore.updateTorrents()
    }

    componentWillUnmount() {
        this.props.torrentsStore.stopUpdate()
    }

    handleAskDeleteToprrent(torrent) {
        this.setState({ torrentToDelete: torrent })
    }

    handleRejectDeleteToprrent() {
        this.setState({ torrentToDelete: null })
    }

    handleAcceptDeleteToprrent(torrent) {
        const { torrentsStore } = this.props
        this.setState({ torrentToDelete: null })
        torrentsStore.deleteTorrent(torrent)
    }

    render() {
        const { torrents, loading } = this.props.torrentsStore
        const { torrentToDelete } = this.state

        return (
            <div>
                {!loading && torrents.length == 0 && <Typography align="center" variant="display1">No active torrents</Typography>}
                <Grid container spacing={16} className="torrents-list">
                    {loading && <div className="loading-center"><CircularProgress /></div>}
                    {!loading && torrents.map((torrent) =>
                        <Grid item xs={12} key={torrent.infoHash}>
                            <TorrentListItem torrent={torrent} onDelete={this.handleAskDeleteToprrent.bind(this)} />
                        </Grid>
                    )}
                    <DeleteTorrentDialog
                        torrent={torrentToDelete}
                        onAccept={this.handleAcceptDeleteToprrent.bind(this)}
                        onReject={this.handleRejectDeleteToprrent.bind(this)}
                    />
                </Grid>
            </div>
        )
    }
}

TorrentsView.propTypes = {
    torrentsStore: PropTypes.object
}

export default TorrentsView