const  { HTTP_PROXY } = require('../config')

module.exports = function (request) {
    if(HTTP_PROXY) return request.proxy(HTTP_PROXY)

    return request
}