var webpack = require('./client/webpack'),
    webpackDevMiddleware = require('./client/webpack-dev-middleware'),
    webpackHotMiddleware = require('./client/webpack-hot-middleware'),
    webpackconfig = require('./client/node_modules/react-scripts/config/webpack.config.dev.js'),
    webpackcompiler = webpack(webpackconfig);
 
//enable webpack middleware for hot-reloads in development
function useWebpackMiddleware(app) {
    app.use(webpackDevMiddleware(webpackcompiler, {
        publicPath: webpackconfig.output.publicPath,
        stats: {
            colors: true,
            chunks: false, // this reduces the amount of stuff I see in my terminal; configure to your needs
            'errors-only': true
        }
    }));
    app.use(webpackHotMiddleware(webpackcompiler, {
        log: console.log
    }));
 
    return app;
}
 
module.exports = {
    useWebpackMiddleware: useWebpackMiddleware
};