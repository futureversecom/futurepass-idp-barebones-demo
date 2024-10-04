const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const buildPath = path.resolve(__dirname, 'dist');
const Dotenv = require('dotenv');
const webpack = require('webpack');

const env = Dotenv.config().parsed;

module.exports = {
  mode: 'development',
  entry: {
    main: './src/pages/login/index.ts',
    callback: './src/pages/callback/callback.ts',
    'signature-callback':
      './src/pages/signature-callback/signature-callback.ts',
  },
  output: {
    filename: '[name].[hash:20].js',
    path: buildPath,
    clean: true,
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
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/pages/login/index.html',
      inject: 'body',
      filename: 'index.html',
      chunks: ['main'],
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/callback/callback.html',
      inject: 'body',
      filename: 'callback.html',
      chunks: ['callback'],
    }),
    new HtmlWebpackPlugin({
      template: './src/pages/signature-callback/signature-callback.html',
      inject: 'body',
      filename: 'signature-callback.html',
      chunks: ['signature-callback'],
    }),
    new NodePolyfillPlugin(),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({ ...env, ...process.env }),
    }),
  ],
  watch: false,
};
