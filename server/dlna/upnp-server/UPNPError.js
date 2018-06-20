class UPNPError extends Error {
    constructor(message, code) {
        super()
        this.name = 'UPnPError'
        this.message = message
        this.code = parseInt(code) || 0
        Error.captureStackTrace(this, UPNPError)
    }
}

module.exports = UPNPError
