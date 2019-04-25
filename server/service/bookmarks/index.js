const lowdb = require('lowdb')
const { pick } = require('lodash')
const FileSync = require('lowdb/adapters/FileSync')
const { ROOT_DIR } = require('../../config')
const path = require('path')
const ResponseError = require('../../utils/ResponseError')

const db = lowdb(new FileSync(path.join(ROOT_DIR, 'bookmarks.db.json')))

db.defaults({ bookmarks: {}}).write()

module.exports = {
    getAllBookmarks() {
        return Object.values(
            db.get('bookmarks').value()
        )
    },
    getBookmark(playlistName) {
        return db.get(['bookmarks', playlistName]).value()
    },
    addPlaylist(playlist) {
        const state = {
            currentTime: 0,
            currentFileIndex: 0,
            playlist
        }

        if(!playlist.files || playlist.files.length == 0)
            throw new ResponseError('No files', 400)
        
        this.update(playlist.name, state)
        
        return state
    },
    update(playlistName, rawState) {
        if(!playlistName) return

        const state = pick(rawState, [
            'playlist.name', 
            'playlist.files', 
            'playlist.torrentInfoHash', 
            'playlist.image', 
            'currentFileIndex'
        ])

        if(Object.keys(state).length == 0) return

        state.ts = Date.now()

        const { currentTime, currentFileIndex } = rawState
        state.playlist.files[currentFileIndex].currentTime = currentTime

        if(db.has(['bookmarks', playlistName]).value()){
            db.get(['bookmarks', playlistName])
                .assign(state)
                .write()
        } else {
            db.set(['bookmarks', playlistName], {
                currentFileIndex: 0,
                playlist: {
                    name: playlistName,
                    files: []
                },
                ...state
            }).write()
        }
    },
    remove(playlistName) {
        if(!playlistName) return

        db.unset(['bookmarks', playlistName])
            .write()
    },
    removeByTorrentInfoHash(torrentInfoHash) {
        const item = this.getAllBookmarks()
            .find((ps) => 
                ps.playlist.torrentInfoHash == torrentInfoHash
            )

        if(item) {
            this.remove(item.playlist.name)
        }
    }
}