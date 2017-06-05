//require our dependencies
var path = require('path')
var webpack = require('webpack')
var BundleTracker = require('webpack-bundle-tracker')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
var merge = require('webpack-merge');
var LodashModuleReplacementPlugin = require('lodash-webpack-plugin')

const common = {
    //the base directory (absolute path) for resolving the entry option
    context: __dirname,
    //the entry point we created earlier. Note that './' means 
    //your current directory. You don't have to specify the extension  now,
    //because you will specify extensions later in the `resolve` section
    entry: {
      main: [
        './assets/js/index',
      ], 
    },

    devtool: 'source-map',
    
    output: {
        //where you want your compiled bundle to be stored
        path: path.resolve('./assets/bundles/'), 
        //naming convention webpack should use for your files
        filename: '[name]-[hash].js', 
        publicPath: '/static/bundles/'
    },
    
    plugins: [
        new webpack.NamedModulesPlugin(),
        //tells webpack where to store data about your bundles.
        new BundleTracker({filename: './webpack-stats.json'}), 
        new webpack.optimize.CommonsChunkPlugin({
          name: 'vendor',
          minChunks: function(module) {
            return module.context && module.context.indexOf('node_modules') !== -1;
          }
        }),
        new webpack.optimize.CommonsChunkPlugin({
          names: 'manifest',
          minChunks: Infinity
        }),
        new ExtractTextPlugin('[name]-[hash].css'),
        new OptimizeCssAssetsPlugin(),
        new LodashModuleReplacementPlugin()
    ],
    
    module: {
        loaders: [
            //a regexp that tells webpack use the following loaders on all 
            //.js and .jsx files
            {test: /\.jsx?$/, 
                //we definitely don't want babel to transpile all the files in 
                //node_modules. That would take a long time.
                exclude: /node_modules/, 
                //use the babel loader 
                loaders: ['babel-loader'] 
            },
            {test: /\.s?css$/, loader: ExtractTextPlugin.extract({loader: 'css-loader!sass-loader'})},
            {test: /\.(png|jpg)$/,
              loaders: [
                'file-loader?name=[path][name].[hash].[ext].webp',
                'webp-loader'
              ]
            }
        ]
    },
    
    resolve: {
        //tells webpack where to look for modules
        //modulesDirectories: ['node_modules'],
        //extensions that should be used to resolve modules
        extensions: ['.js', '.jsx'] 
    }
}

const production = merge(common, {
});

const development = merge(common, {
  entry: {
    webpack: [
      'react-hot-loader/patch',
      'webpack-dev-server/client?http://localhost:8080',
      'webpack/hot/only-dev-server'
    ]
  },
  devServer: {
    hot: true,
    contentBase: path.resolve(__dirname, 'assets'),
    publicPath: '/',
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    }
  },
  output: {
    publicPath: 'http://localhost:8080/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
});

const TARGET = process.env.NODE_ENV;

switch (TARGET) {
  case 'production':
    module.exports = production;
    break;
  default:
    module.exports = development;
}
