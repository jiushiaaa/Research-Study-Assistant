const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 已移除百度相关API代理。DeepSeek API 直接走公网，无需本地代理。
}; 