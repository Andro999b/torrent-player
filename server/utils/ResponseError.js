class ResponseError extends Error {
    constructor(message, code) {
        super(message)
        this.code = isNaN(code) ? 400 : code
        this.message = message || 'Bad request'
        Error.captureStackTrace(this, ResponseError)
    }
}

module.exports = ResponseError