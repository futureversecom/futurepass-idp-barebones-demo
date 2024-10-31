const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const buildPath = path.resolve(__dirname, 'dist', 'browser')
const Dotenv = require('dotenv')
const webpack = require('webpack')
Dotenv.config()

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development'
  return {
    mode: 'development',
    entry: {
      main: './src/browser/login/index.ts',
      callback: './src/browser/callback/callback.view.ts',
      'signature-callback':
        './src/browser/signature-callback/signature-callback.view.ts',
    },
    output: {
      filename: '[name].[hash:20].js',
      path: buildPath,
    },
    devServer: {
      static: path.join(__dirname, 'dist'),
      port: 3000,
      historyApiFallback: {
        rewrites: [
          { from: /^\/callback$/, to: '/callback.html' },
          { from: /^\/signature-callback$/, to: '/signature-callback.html' },
        ],
      },
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
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      fallback: {
        net: false,
        tls: false,
        fs: false,
        promises: false,
        util: false,
        stream: false,
        http: false,
        https: false,
        url: false,
        process: false,
        worker_threads: false,
      },
      alias: {
        openURL: path.resolve(__dirname, 'src/shared/open-url.browser.ts'),
        shared: path.resolve(__dirname, 'src/shared'),
      },
    },
    externals: {
      'node:fs/promises': 'commonjs2 node:fs/promises',
    },
    plugins: [
      new NodePolyfillPlugin(),
      new HtmlWebpackPlugin({
        template: './src/browser/login/index.html',
        inject: 'body',
        filename: 'index.html',
        chunks: ['main'],
      }),
      new HtmlWebpackPlugin({
        template: './src/browser/callback/callback.html',
        inject: 'body',
        filename: 'callback.html',
        chunks: ['callback'],
      }),
      new HtmlWebpackPlugin({
        template: './src/browser/signature-callback/signature-callback.html',
        inject: 'body',
        filename: 'signature-callback.html',
        chunks: ['signature-callback'],
      }),
      new webpack.DefinePlugin({
        'process.env': JSON.stringify({
          ...env,
          ...process.env,
          isBrowser: true,
        }),
      }),
    ],
    watch: isDevelopment,
  }
}
