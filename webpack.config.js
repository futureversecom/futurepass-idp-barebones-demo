const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const buildPath = path.resolve(__dirname, 'dist');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/pages/login/index.ts',
    callback: './src/pages/callback/callback.ts',
  },
  output: {
    filename: '[name].[hash:20].js',
    path: buildPath,
  },
  devServer: {
    static: path.join(__dirname, 'dist'),
    port: 3000,
    historyApiFallback: {
      rewrites: [{ from: /^\/callback$/, to: '/callback.html' }],
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
    new NodePolyfillPlugin(),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  watch: true,
};
