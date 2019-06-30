const path = require('path');
const webpack = require('webpack');

PLUGINS = [
  new webpack.EnvironmentPlugin(['NODE_ENV']),
];

module.exports = {
  devServer: {
    disableHostCheck: true,
    hotOnly: true
  },
  entry: {
    build: './src/index.js'
  },
  output: {
    globalObject: 'this',
    path: __dirname,
    filename: 'build.js'
  },
  plugins: PLUGINS,
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /(node_modules)/,
        use: ['babel-loader']
      },
      {
        test: /\.json/,
        exclude: /(node_modules)/,
        type: 'javascript/auto',
        loader: ['json-loader']
      },
      {
        test: /\.styl/,
        exclude: /(node_modules)/,
        use: ['style-loader', 'css-loader', 'stylus-loader']
      },
      {
        test: /\.(png|jpg)/,
        loader: 'url-loader'
      }
    ]
  },
  resolve: {
    modules: [path.join(__dirname, 'node_modules')]
  }
};
