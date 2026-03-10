const path = require('path');
const { rspack } = require('@rspack/core');

const isDev = process.env.NODE_ENV === 'development';

const paths = {
  src: path.resolve(__dirname, 'src'),
  dist: path.resolve(__dirname, 'dist'),
};

module.exports = {
  context: paths.src,
  mode: isDev ? 'development' : 'production',
  entry: './index.ts',
  watchOptions: isDev
    ? { ignored: ['**/node_modules/**', '**/.helfy/**'] }
    : {},
  devServer: {
    hot: true,
    port: 3000,
    static: { directory: paths.src },
    compress: true,
    historyApiFallback: true,
  },
  output: {
    filename: 'bundle.js',
    path: paths.dist,
    publicPath: '/',
    clean: true,
  },
  resolve: {
    modules: ['src', 'node_modules'],
    extensions: ['.ts', '.js', '.tsx', '.jsx', '.css'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
    },
  },
  plugins: [
    new rspack.HtmlRspackPlugin({
      template: './index.html',
      minify: !isDev ? { collapseWhitespace: true } : false,
    }),
    new rspack.CssExtractRspackPlugin({
      filename: `css/${isDev ? '[name]' : '[contenthash:8]_[id]'}.css`,
      ignoreOrder: true,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        type: 'javascript/auto',
        use: [
          rspack.CssExtractRspackPlugin.loader,
          { loader: 'css-loader', options: { importLoaders: 1 } },
        ],
      },
      {
        test: /\.tsx$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          require.resolve('@helfy/helfy/compiler/helfy-loader'),
        ],
      },
      {
        test: /\.(ts|js)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
};
