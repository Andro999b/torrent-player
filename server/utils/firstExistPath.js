const fs = require('fs')

module.exports = (paths) => 
    paths.find((path) => 
        path && fs.existsSync(path)
    )