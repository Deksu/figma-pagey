const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

class FigmaInlineUiPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('FigmaInlineUiPlugin', (compilation) => {
      const { RawSource } = compiler.webpack.sources;
      compilation.hooks.processAssets.tap(
        {
          name: 'FigmaInlineUiPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
        },
        (assets) => {
          const htmlAsset = assets['ui.html'];
          const uiJsAsset = assets['ui.js'];
          const codeAsset = assets['code.js'];

          if (!htmlAsset || !uiJsAsset || !codeAsset) {
            return;
          }

          let html = htmlAsset.source().toString();
          const uiJs = uiJsAsset.source().toString();
          const uiJsBase64 = Buffer.from(uiJs, 'utf8').toString('base64');
          const inlineScript = `<script>eval(atob("${uiJsBase64}"))</script>`;

          html = html.replace(
            /<script[^>]*src="ui\.js"[^>]*><\/script>/,
            inlineScript
          );

          compilation.updateAsset('ui.html', new RawSource(html));

          const code = codeAsset.source().toString();
          const updatedCode = code.replace(/__html__/g, JSON.stringify(html));
          compilation.updateAsset('code.js', new RawSource(updatedCode));
        }
      );
    });
  }
}

module.exports = {
  entry: {
    ui: './src/ui.tsx',
    code: './src/code.ts'
  },
  mode: 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|svg)$/,
        type: 'asset/inline'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui.html',
      filename: 'ui.html',
      chunks: ['ui'],
      inject: 'body'
    }),
    new FigmaInlineUiPlugin(),
    new webpack.DefinePlugin({
      __PLUGIN_VERSION__: JSON.stringify(
        require('./package.json').version || '0.0.0'
      )
    })
  ]
};
