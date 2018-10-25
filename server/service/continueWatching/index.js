const lowdb = require('lowdb')
const { pick } = require('lodash')
const FileSync = require('lowdb/adapters/FileSync')
const { ROOT_DIR } = require('../../config')
const path = require('path')

const db = lowdb(new FileSync(path.join(ROOT_DIR, 'watchedRecently.db.json')))

db.defaults({ playerState: {}}).write()

module.exports = {
    getAll() {
        return Object.values(
            db.get('playerState').value()
        )
    },
    getRecentPlayerState(playlistName) {
        return db.get(['playerState', playlistName]).value()
    },
    addPlaylist(playlist) {
        const playerState = {
            currentTime: 0,
            currentFileIndex: 0,
            playlist
        }
        this.updatePlayerState(playlist.name, playerState)
        return playerState
    },
    updatePlayerState(playlistName, rawState) {
        if(!playlistName) return

        const state = pick(rawState, [
            'currentTime', 
            'playlist', 
            'currentFileIndex'
        ])

        if(Object.keys(state).length == 0) return

        if(db.has(['playerState', playlistName]).value()){
            db.get(['playerState', playlistName])
                .assign(state)
                .write()
        } else {
            db.set(['playerState', playlistName], state)
                .write()
        }

    },
    remove(playlistName) {
        if(!playlistName) return

        db.unset(['playerState', playlistName])
            .write()
    },
    removeByTorrentInfoHash(torrentInfoHash) {
        db.get('playerState')
            .remove((ps) => 
                ps.playlist.torrentInfoHash == torrentInfoHash
            )
            .write()
    }
}