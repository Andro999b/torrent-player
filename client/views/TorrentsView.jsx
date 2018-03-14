import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Grid from 'material-ui/Grid'
import TorrentListItem from '../components/TorrentListItem'
import Typography from 'material-ui/Typography'
import { observer } from 'mobx-react'

@observer
class TorrentsView extends Component {

    componentDidMount() {
        //this.props.torrentsStore.startUpdate()
        this.props.torrentsStore.updateTorrents()
    }

    componentWillUnmount() {
        this.props.torrentsStore.stopUpdate()
    }

    render() {
        const { torrents } = this.props.torrentsStore

        return (
            <Grid container spacing={16} className="torrents-list">
                {torrents.length == 0 && <Typography align="center" variant="display1">No active torrents</Typography>}
                {torrents.map((torrent) =>
                    <Grid item xs={12} key={torrent.infoHash}>
                        <TorrentListItem torrent={torrent}/>
                    </Grid>
                )}
            </Grid>
        )
    }
}

TorrentsView.propTypes = {
    torrentsStore: PropTypes.object.isRequired
}

export default TorrentsView