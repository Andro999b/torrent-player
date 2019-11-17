const lowdb = require('lowdb')
const { pick } = require('lodash')
const FileSync = require('lowdb/adapters/FileSync')
const { ROOT_DIR } = require('../../config')
const path = require('path')
const ResponseError = require('../../utils/ResponseError')

const db = lowdb(new FileSync(path.join(ROOT_DIR, 'bookmarks.db.json')))

db.defaults({ bookmarks: {}}).write()

module.exports = {
    async getAllBookmarks() {
        return Object.values(
            db.get('bookmarks').value()
        )
    },
    async getBookmark(playlistName) {
        return db.get(['bookmarks', playlistName]).value()
    },
    async addPlaylist(playlist) {
        const state = {
            currentTime: 0,
            currentFileIndex: 0,
            playlist
        }

        if(!playlist.files || playlist.files.length == 0)
            throw new ResponseError('No files', 400)

        await this.update(playlist.name, state)

        return state
    },
    async update(playlistName, rawState) {
        if(!playlistName) return

        const state = pick(rawState, [
            'playlist',
            'marks',
            'currentFileIndex',
        ])

        if(Object.keys(state).length == 0) return

        state.ts = Date.now()

        if(db.has(['bookmarks', playlistName]).value()){
            await db.get(['bookmarks', playlistName])
                .merge(state)
                .write()
        } else {
            await db.set(['bookmarks', playlistName], {
                currentFileIndex: 0,
                playlist: {
                    name: playlistName,
                    files: []
                },
                ...state
            }).write()
        }
    },
    async remove(playlistName) {
        if(!playlistName) return

        await db.unset(['bookmarks', playlistName]).write()
    },
    async removeByTorrentInfoHash(torrentInfoHash) {
        const bookmarks = await this.getAllBookmarks()
        const bookmark = bookmarks.find((ps) => ps.playlist.torrentInfoHash == torrentInfoHash)

        if(bookmark) {
            await this.remove(bookmark.playlist.name)
        }
    }
}