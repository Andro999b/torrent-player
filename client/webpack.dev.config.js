const webpackConfig = require('./webpack.config')
// const webpack = require('webpack')
const merge = require('webpack-merge')

module.exports = merge(webpackConfig, {
    mode: 'development',
    devtool: 'cheap-module-eval-source-map',
    watch: true,
    devServer: {
        port: 3000,
        host: '0.0.0.0',
        //hot: true,
        proxy: [{
            context: ['/api', '/proxyMedia', '/extractVideo'],
            target: 'http://localhost:8080'
        }, {
            context: '/',
            target: 'ws://localhost:8080'
        }]
    },
    // plugins: [
    //     new webpack.HotModuleReplacementPlugin()
    // ]
})