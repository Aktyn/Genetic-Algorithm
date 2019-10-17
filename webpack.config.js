//const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
	entry: {
		main: './src/index.tsx'
	},
	output: {
		filename: '[name].js',
		chunkFilename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},
	mode: isDevelopment ? 'development' : 'production',
	devtool: isDevelopment && "source-map",
	devServer: {
		historyApiFallback: true,
		port: 3000,
		open: true
	},
	resolve: {
		extensions: ['.js', '.json', '.ts', '.tsx'],
	},
	node: {
		fs: "empty"
	},
	optimization: isDevelopment ? undefined : {
		minimize: true,
		minimizer: [
			new UglifyJsPlugin({
				exclude: 'sw.js',
				uglifyOptions: {
					output: {
						comments: false
					},
					ie8: false,
					toplevel: true
				}
			})
		],
		splitChunks: {
			//chunks: 'all',
			automaticNameDelimiter: '-',
			
			cacheGroups: {
				styles: {
					name: 'styles',
					test: /\.s?css$/,
					chunks: 'all',
					// minChunks: 1,
					priority: -1,
					reuseExistingChunk: true,
					enforce: true,
				}
			}
		}
	},
	
	module: {
		rules: [
			{
				test: /^(?!\.\/node_modules).*([^.].\.tsx?)$/,
				loader: 'awesome-typescript-loader'
			}, {
				test: /\.(scss|css)$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: "css-loader",
						options: {
							sourceMap: isDevelopment,
							minimize: !isDevelopment
						}
					},
					{
						loader: "postcss-loader",
						options: {
							autoprefixer: {
								browsers: 'last 2 versions, > 1%'
							},
							sourceMap: isDevelopment,
							plugins: () => [
								autoprefixer
							]
						},
					},
					{
						loader: "sass-loader",
						options: {
							sourceMap: isDevelopment
						}
					}
				]
			}, {
				test: /\.(jpe?g|png|gif|svg|ttf)$/,
				use: [
					{
						loader: "file-loader",
						options: {
							attrs: ['img:src', 'link:href', 'image:xlink:href'],
							name: '[name].[ext]',
							outputPath: 'static/',
							useRelativePath: true,
						}
					},
					{
						loader: 'image-webpack-loader',
						options: {
							mozjpeg: {
								progressive: true,
								quality: 80
							},
							optipng: {
								enabled: true,
							},
							pngquant: {
								quality: '80-90',
								speed: 4
							},
							gifsicle: {
								interlaced: false,
							}
						}
					}
				]
			}
		],
	},
	
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name]-styles.css",
			chunkFilename: "[id].css"
		}),
		new HtmlWebpackPlugin({
			hash: isDevelopment,
			favicon: './src/img/icon.png',
			title: 'AI POWER',
			minify: !isDevelopment,
			template: './src/index.html',
			filename: './index.html',
		})
	]
};
