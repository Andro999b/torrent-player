import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Dialog, { DialogTitle, DialogContent, DialogContentText, DialogActions } from 'material-ui/Dialog'
import Button from 'material-ui/Button'

class DeleteTorrentDialog extends Component {
    constructor(props, context) {
        super(props, context)
        
        this.state = {
            torrentName: ''
        }
    }
    
    componentWillReceiveProps(nextProps) { //prepare data for render content
        if(nextProps.torrent) {
            this.setState({torrentName: nextProps.torrent.name})
        }
    }

    render() {
        const { torrentName } = this.state
        const { torrent, onAccept, onReject } = this.props

        return (
            <Dialog open={torrent != null} onClose={onReject}>
                <DialogTitle>Delete torrent?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Do you want to delete torrent {torrentName} and all data?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onReject} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={() => onAccept(torrent)} color="secondary" variant="raised" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        )
    }
}

DeleteTorrentDialog.propTypes = {
    torrent: PropTypes.object,
    onAccept: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired
}

export default DeleteTorrentDialog