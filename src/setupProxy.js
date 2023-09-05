const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = function (app) {
  app.use(
    createProxyMiddleware('/api', {
      target: 'http://18.207.198.224:8080',
      changeOrigin: true,
    }),
  );
};