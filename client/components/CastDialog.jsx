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
        transitionStore: { castDialog, closeCastDailog, downloadAndPlayMediaOnDevice },
        remoteControl: { devices }
    }) => ({ options: castDialog, closeCastDailog, downloadAndPlayMediaOnDevice, devices })
)
@observer
class CastDialog extends Component {

    handleSelectDevice(device) {
        const { options: { result, item }, downloadAndPlayMediaOnDevice } = this.props
        downloadAndPlayMediaOnDevice(result, item, device)
    }

    render() {
        const { options, devices, closeCastDailog } = this.props

        return (
            <Dialog open={options != null} onClose={closeCastDailog}>
                {devices.length == 0 && <DialogTitle>No avaliable devices</DialogTitle>}
                {devices.length > 0 &&
                    <div>
                        <List>
                            {devices.map((device) =>
                                <ListItem key={device.name} button
                                    onClick={() => this.handleSelectDevice(device)}
                                >
                                    <ListItemText primary={device.name} />
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
    options: PropTypes.object,
    devices: PropTypes.array,
    closeCastDailog: PropTypes.func,
    downloadAndPlayMediaOnDevice: PropTypes.func,
}

export default CastDialog