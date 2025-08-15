const path = require('path');
const { merge } = require('webpack-merge');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const commonConfig = require('./webpack.base.config');
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = merge(commonConfig, {
    mode: 'development',
    devtool: 'eval-cheap-module-source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, 'build'),
        },
        compress: true,
        port: 3001,
        host: '0.0.0.0',
        hot: true,
        liveReload: true,
        watchFiles: {
            paths: ['src/**/*'],
            options: {
                usePolling: false,
            },
        },
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'game.html',
            filename: 'index.html',
            inject: true
        }),
        // new CopyWebpackPlugin({
        //     patterns: [
        //         { from: 'createGameData.js', to: 'createGameData.js' },
        //         { from: 'validateGameData.js', to: 'validateGameData.js' },
        //         { from: 'node_modules/crypto-js/crypto-js.js', to: 'node_modules/crypto-js/crypto-js.js' }
        //     ]
        // }),
    ],
});
