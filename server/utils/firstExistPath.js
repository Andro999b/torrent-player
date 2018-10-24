const fs = require('fs')

module.exports = (paths) => 
    paths.find((path) => 
        fs.existsSync(path)
    )