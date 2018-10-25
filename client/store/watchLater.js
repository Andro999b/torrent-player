import superagent from 'superagent'
import notificationsStore from './notifications-store'

export default function(playlist) {
    return superagent
        .post('/api/library/continueWatching')
        .send(playlist)
        .then(() => {
            notificationsStore.showMessage(`Playlist ${playlist.name} added`)
        })
        .catch((e) => {
            console.error(e)
            notificationsStore.showMessage(`Fail add playlist ${playlist.name}`)
        })
}