const path = require('path')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const Dotenv = require('dotenv')
Dotenv.config()
const buildPath = path.resolve(__dirname, 'dist', 'server')

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development'

  return {
    mode: isDevelopment ? 'development' : 'production',
    target: 'node',
    entry: './src/server/main.ts',
    output: {
      filename: 'server.js',
      path: buildPath,
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new NodePolyfillPlugin(),
      new webpack.ProvidePlugin({
        crypto: 'crypto',
      }),
      new webpack.BannerPlugin({
        banner: 'require("source-map-support").install();',
        raw: true,
        entryOnly: false,
      }),
      new webpack.DefinePlugin({
        'process.env': JSON.stringify(process.env),
      }),
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        crypto: require.resolve('crypto-browserify'),
      },
      alias: {
        openURL: path.resolve(__dirname, 'src/shared/open-url.server.ts'),
        shared: path.resolve(__dirname, 'src/shared'),
      },
    },
    devtool: 'source-map',
    watch: isDevelopment,
  }
}
