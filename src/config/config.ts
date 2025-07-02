// API配置
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || '',
  MCP_BASE_URL: process.env.REACT_APP_MCP_BASE_URL || 'http://localhost:8081/api/v1',
  TIMEOUT: 30000,
};

// 百度地图配置
export const BAIDU_MAP_CONFIG = {
  // 前端地图显示用的API Key
  API_KEY: 'mXU9IyCTjNua2LATfxdX4ksM8iXBj5uU',
  // 地图默认中心点（上海虹口区）
  DEFAULT_CENTER: {
    lng: 121.505,
    lat: 31.245
  },
  // 默认缩放级别
  DEFAULT_ZOOM: 13
}; 
 