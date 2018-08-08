const { Readable } = require('stream')
const { EventEmitter } = require('events')
const debug = console.log

class CycleBuffer extends EventEmitter {
    constructor(options) {
        super()
        this.writable = true
        this.capacity = options.capacity
        this.chunks = []
        this.length = 0
        this.zeroIndex = 0
        this.writeIndex = 0
        this.readIndex = 0
        this.continueWatermark = (options.continueFactor || 0.5) * this.capacity
        this.stopWatermark = (options.stopFactor || 0.75) * this.capacity
        this.writeFinished = false
        this.bytesWrited = 0
    }

    _resetReadIndex() {
        this.readIndex = this.zeroIndex
    }

    _rewind() {
        this.zeroIndex = this.readIndex
    }

    freeSpace() {
        return this.capacity - this._toZeroRelIndex(this.writeIndex) - 1
    }

    readedSpace() {
        return this._toZeroRelIndex(this.readIndex)
    }

    writedSpace() {
        return this._toZeroRelIndex(this.writeIndex)
    }

    _incWriteIndex() {
        this.writeIndex = (this.writeIndex + 1) % this.capacity
    }

    _incReadIndex() {
        this.readIndex = (this.readIndex + 1) % this.capacity
    }

    _incZeroIndex() {
        this.zeroIndex = (this.zeroIndex + 1) % this.capacity
    }

    _toZeroRelIndex(i) {
        i = i - this.zeroIndex
        if (i < 0)
            return i + this.capacity
        return i
    }

    write(chunk) {
        const freeSpace = this.freeSpace()
        if (freeSpace > 0) {
            this.chunks[this.writeIndex] = chunk
            this.bytesWrited += chunk.length
            this._incWriteIndex()
        } else if (this.readedSpace() > 0) {
            this.chunks[this.writeIndex] = chunk
            this.bytesWrited += chunk.length
            this._incWriteIndex()
            this._incZeroIndex() // move zero
        } else {
            console.error('buffer is full')
            this.emit('full')
        }
        this._checkFillFactor()
    }

    final() {
        debug('End writing')
        this.writeFinished = true
    }

    _checkFillFactor() {
        const filledSpace = this.writedSpace() - this.readedSpace()

        if (filledSpace > this.stopWatermark) {
            debug('Reading stopWritting') 
            this.emit('stopWritting')
        } else if (filledSpace < this.continueWatermark) {
            this.emit('continueWritting')
        }
    }

    readNext(rewind) {
        if (this.readedSpace() < this.writedSpace()) {
            const chunk = this.chunks[this.readIndex]

            this._incReadIndex()
            if (rewind) //free readed space
                this._rewind()

            this._checkFillFactor()

            return chunk
        } else {
            return null
        }
    }

    readStream(options) {
        if (this._readStream) {
            this._readStream.destroy()
            this._resetReadIndex()
        }

        this._readStream = new CycleBufferReader({ ...options, buffer: this })
        return this._readStream
    }
}

class CycleBufferReader extends Readable {
    constructor(options) {
        super(options)
        this.buffer = options.buffer
        this.limit = options.limit != undefined ? options.limit : 0
        this.rewind = options.rewind != undefined ? options.rewind : false
    }

    _read() {
        let readedBytes = 0
        const doRead = () => {
            if (this.readFinished) return

            //break reading if limit reached 
            if (this.limit && readedBytes >= this.limit) {
                return
            }

            const chunk = this.buffer.readNext(this.rewind)
            if (!chunk) {
                if (this.buffer.writeFinished) { // reach end of buffer
                    this.push(null)
                    return
                }
            } else {
                if (!this.push(chunk)){
                    return
                }

                readedBytes += chunk.length
            }
            setTimeout(() => doRead())
        }
        doRead()
    }

    _destroy() {
        this.readFinished = true
    }
}

module.exports = CycleBuffer