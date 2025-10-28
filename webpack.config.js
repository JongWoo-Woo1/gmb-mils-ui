const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'web', // ← 에러 해결 포인트
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    assetModuleFilename: 'assets/[name].[contenthash][ext]',
    clean: true,
    // chunkFormat: 'array-push',          // ← 드물게 필요하면 주석 해제(옵션)
  },
  module: {
    rules: [
      { test: /\.css$/i, use: ['style-loader', 'css-loader'] }, // 최소 구성
      { test: /\.(png|jpe?g|gif|svg)$/i, type: 'asset/resource' },
      {
        test: /\.html$/i,
        include: [
          path.resolve(__dirname, 'src/views'),
          path.resolve(__dirname, 'src/components'),
        ],
        type: 'asset/source', // ← 로더 없이 원문 문자열로 import
      },
    ],
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
  devtool: 'source-map',
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 9001,
    open: false,
    hot: false, // 애니메이션/효과 불필요 → HMR 비활성화
    liveReload: true,
  },
};
