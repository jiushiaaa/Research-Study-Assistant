// 环境配置
export const config = {
  // API基础URL
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1',
  
  // 环境变量
  environment: process.env.NODE_ENV || 'development',
  
  // 是否为开发环境
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // 是否为生产环境
  isProduction: process.env.NODE_ENV === 'production',
  
  // API超时时间（毫秒）
  apiTimeout: 30000,
  
  // 轮询间隔（毫秒）
  pollingInterval: 2000,
  
  // 最大轮询次数
  maxPollingAttempts: 30
};

export default config; 