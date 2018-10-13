import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { inject, observer } from 'mobx-react'
import {
    Dialog,
    DialogTitle,
    List,
    ListItem,
    ListItemText
} from '@material-ui/core'

@inject(
    ({
        transitionStore: { castDialog, closeCastDailog },
        remoteControl: { devices }
    }) => ({ options: castDialog, closeCastDailog, devices })
)
@observer
class CastDialog extends Component {

    handleSelectDevice(device) {
        const { options: { onDeviceSelected } } = this.props
        onDeviceSelected(device)
    }

    render() {
        const { options, devices, closeCastDailog } = this.props
        const filter = options && options.filter
        const filtered = 
            typeof filter == 'function' ? 
                devices.filter(filter) :
                devices

        return (
            <Dialog open={options != null} onClose={closeCastDailog}>
                {filtered.length == 0 && <DialogTitle>No avaliable devices</DialogTitle>}
                {filtered.length > 0 &&
                    <div>
                        <List>
                            {filtered.map((device) =>
                                <ListItem key={device.name} button
                                    onClick={() => this.handleSelectDevice(device)}
                                >
                                    <ListItemText style={{ wordBreak: 'break-all' }}
                                        primary={
                                            device.name + (device.playlistName ? ' - ' + device.playlistName : '')
                                        } 
                                    />
                                </ListItem>
                            )}
                        </List>
                    </div>
                }
            </Dialog>
        )
    }
}

CastDialog.propTypes = {
    options: PropTypes.shape({
        filter: PropTypes.func,
        onDeviceSelected: PropTypes.func
    }),
    devices: PropTypes.array,
    closeCastDailog: PropTypes.func
}

export default CastDialog