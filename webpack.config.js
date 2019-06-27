const MiniCssExtractPlugin = require('mini-css-extract-plugin');
module.exports = {
  entry: {
    content: './src/js/content/index.js',
    popup: './src/js/popup/index.js',
    background: './src/js/background/index.js'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/build'
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: process.env.NODE_ENV === 'development',
            },
          },
          'css-loader'
        ],
      },
    ],
  },
};