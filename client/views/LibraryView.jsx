import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'

import TorrentListItem from '../components/TorrentListItem'
import DeleteDialog from '../components/DeleteDialog'
import BookmarkItem from '../components/BookmarkItem'

import {
    CircularProgress,
    Typography,
    TextField,
    Tabs,
    Tab,
    Chip
} from '@material-ui/core'

import { observer, inject } from 'mobx-react'
import memoize from 'memoize-one'

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
            torrentToDelete: null,
            filter: '',
            tab: 0
        }
    }

    componentDidMount() {
        this.props.libraryStore.startUpdate()
    }
    componentWillUnmount() {
        this.props.libraryStore.stopUpdate()
    }
    handleFilterChange = (e) => this.setState({ filter: e.target.value })
    handleRemoveBookmark = (item) => this.props.libraryStore.removeBookmark(item)
    handleAskDeleteToprrent = (torrent) => this.setState({ torrentToDelete: torrent })
    handleRejectDeleteToprrent = () => this.setState({ torrentToDelete: null })
    handleAcceptDeleteToprrent = (torrent) => {
        const { libraryStore } = this.props
        this.setState({ torrentToDelete: null })
        libraryStore.deleteTorrent(torrent)
    }
    handleSelectTab = (_, tab) => this.setState({ tab })

    filterBookmarks = memoize((bookmarks, filter) => {
        if (filter == '') return bookmarks

        filter = filter.toLowerCase()
        return bookmarks.filter((bookmark) =>
            bookmark.playlist.name
                .toLowerCase()
                .search(filter) != -1
        )
    })

    filterTorrents = memoize((torrents, filter) => {
        if (filter == '') return torrents

        filter = filter.toLowerCase()
        return torrents.filter((torrent) =>
            torrent.name
                .toLowerCase()
                .search(filter) != -1
        )
    })

    renderBookmarks(bookmarks) {
        const { transitionStore: { playMedia, openCastDialog } } = this.props

        return (
            <Fragment>
                {bookmarks.length == 0 &&
                    <Typography variant="h5" className="center" align="center" >
                        No bookmarks
                    </Typography>
                }
                {bookmarks.length != 0 && bookmarks.map((item) =>
                    <div key={item.playlist.name} className="library__item">
                        <BookmarkItem item={item}
                            onPlay={playMedia}
                            onCast={openCastDialog}
                            onRemove={this.handleRemoveBookmark}
                        />
                    </div>
                )}
            </Fragment>
        )
    }

    renderTorrents(torrents) {
        return (
            <Fragment>
                {torrents.length == 0 &&
                    <Typography variant="h5" className="center" align="center" >
                        No torrents
                    </Typography>
                }
                {torrents.length != 0 && torrents.map((torrent) =>
                    <div key={torrent.infoHash} className="library__item">
                        <TorrentListItem torrent={torrent} onDelete={this.handleAskDeleteToprrent.bind(this)} />
                    </div>
                )}
            </Fragment>
        )
    }

    renderContent() {
        const { libraryStore: { library: { torrents, bookmarks } } } = this.props
        let { filter, tab } = this.state

        const filteredBookmarks = this.filterBookmarks(bookmarks, filter)
        const filteredTorrets = this.filterTorrents(torrents, filter)

        let emptyLibrary = torrents.length == 0 && bookmarks.length == 0

        if (emptyLibrary) {
            return (
                <Typography className="center" align="center" variant="h4">
                    Library is empty
                </Typography>
            )
        } else {
            let content
            let fixedFilter = false

            if (torrents.length == 0) {
                fixedFilter = true
                content = this.renderBookmarks(filteredBookmarks)
            } else {
                content = (
                    <Fragment>
                        <Tabs
                            className="library__tabs"
                            indicatorColor="primary"
                            value={tab}
                            onChange={this.handleSelectTab}
                        >
                            <Tab color="primary" label={<span>
                                <span className="vmiddle">Continue Watching </span><Chip size="small" label={bookmarks.length} />
                            </span>} />
                            <Tab color="primary" label={<span>
                                <span className="vmiddle">Torrents </span><Chip size="small" label={torrents.length} />
                            </span>} />
                        </Tabs>
                        {tab == 0 && this.renderBookmarks(filteredBookmarks)}
                        {tab == 1 && this.renderTorrents(filteredTorrets)}
                    </Fragment>
                )
            }

            return (
                <Fragment>
                    <div className={`library__filter${fixedFilter ? '-fixed' : ''}`}>
                        <TextField
                            placeholder="Filter"
                            value={filter}
                            onChange={this.handleFilterChange}
                            fullWidth
                        />
                    </div>
                    {content}
                </Fragment>
            )
        }
    }

    render() {
        const { libraryStore: { loading } } = this.props
        const { torrentToDelete } = this.state

        return (
            <div className="library">
                {loading && <div className="center"><CircularProgress /></div>}
                {!loading && this.renderContent()}
                <DeleteTorrentDialog
                    item={torrentToDelete}
                    onAccept={this.handleAcceptDeleteToprrent.bind(this)}
                    onReject={this.handleRejectDeleteToprrent.bind(this)}
                />
            </div>
        )
    }
}

LibraryView.propTypes = {
    libraryStore: PropTypes.object,
    transitionStore: PropTypes.object
}

export default LibraryView