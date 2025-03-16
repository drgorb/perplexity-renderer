const path = require('path');

module.exports = {
    entry: {
        popup: './popup.js',
        background: './background.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    // mode: 'development',
    // mode: 'production',
    devtool: 'source-map', // Use 'source-map' instead of 'eval-source-map'
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    }
};