const webpackConfig = require('./webpack.config')
// const webpack = require('webpack')
const merge = require('webpack-merge')

module.exports = merge(webpackConfig, {
    mode: 'development',
    devtool: 'cheap-eval-source-map',
    watch: true,
    devServer: {
        port: 3000,
        //hot: true,
        proxy: [{
            context: ['/api', '/proxyMedia', '/extractVideo'],
            target: 'http://localhost:8080'
        }, {
            context: '/rc',
            target: 'ws://localhost:8080'
        }]
    },
    // plugins: [
    //     new webpack.HotModuleReplacementPlugin()
    // ]
})