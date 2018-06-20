const dlna = require('./server/dlna')
const torrentsService = require('./server/service/torrents')
const web = require('./server/web')

torrentsService.restoreTorrents()
web()
// dlna()

process.on('uncaughtException', function (err) {
    console.error(err)
})