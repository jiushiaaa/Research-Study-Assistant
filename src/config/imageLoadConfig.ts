/**
 * 图片加载配置管理
 */

export interface ImageLoadConfig {
  // 测试相关配置
  testTimeout: number;
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number;
  
  // 缓存相关配置
  enableCache: boolean;
  cacheExpiry: number;
  maxCacheSize: number;
  
  // 代理服务配置
  proxyEndpoints: string[];
  fallbackServices: string[];
  
  // 调试相关配置
  enableDebugMode: boolean;
  enableDetailedLogs: boolean;
  enablePerformanceMonitoring: boolean;
  
  // 优化相关配置
  enablePreload: boolean;
  batchSize: number;
  progressUpdateInterval: number;
}

// 默认配置
const defaultConfig: ImageLoadConfig = {
  // 测试相关配置
  testTimeout: 5000,           // 5秒超时
  maxConcurrent: 3,            // 最大并发数
  retryAttempts: 2,            // 重试次数
  retryDelay: 1000,            // 重试延迟
  
  // 缓存相关配置
  enableCache: true,           // 启用缓存
  cacheExpiry: 30 * 60 * 1000, // 30分钟过期
  maxCacheSize: 1000,          // 最大缓存1000条
  
  // 代理服务配置
  proxyEndpoints: [
    'https://images.weserv.nl/?url=',
    'https://imageproxy.pimg.tw/resize?url=',
    'https://cors-anywhere.herokuapp.com/',
  ],
  fallbackServices: [
    'https://via.placeholder.com/400x300/f0f0f0/666666?text=',
    'https://picsum.photos/400/300?random=',
  ],
  
  // 调试相关配置
  enableDebugMode: process.env.NODE_ENV === 'development',
  enableDetailedLogs: process.env.NODE_ENV === 'development',
  enablePerformanceMonitoring: true,
  
  // 优化相关配置
  enablePreload: true,         // 启用预加载
  batchSize: 5,               // 批处理大小
  progressUpdateInterval: 100, // 进度更新间隔(ms)
};

// 生产环境优化配置
const productionConfig: Partial<ImageLoadConfig> = {
  testTimeout: 3000,           // 生产环境更短的超时
  maxConcurrent: 5,            // 生产环境可以更高并发
  enableDebugMode: false,      // 生产环境关闭调试
  enableDetailedLogs: false,   // 生产环境关闭详细日志
  cacheExpiry: 60 * 60 * 1000, // 生产环境缓存1小时
};

// 开发环境调试配置
const developmentConfig: Partial<ImageLoadConfig> = {
  testTimeout: 8000,           // 开发环境更长的超时便于调试
  enableDebugMode: true,       // 开发环境启用调试
  enableDetailedLogs: true,    // 开发环境启用详细日志
  maxConcurrent: 2,           // 开发环境降低并发避免过多日志
};

// 配置管理类
class ImageLoadConfigManager {
  private static instance: ImageLoadConfigManager;
  private config: ImageLoadConfig;

  private constructor() {
    // 根据环境选择配置
    const envConfig = process.env.NODE_ENV === 'production' 
      ? productionConfig 
      : developmentConfig;
    
    this.config = { ...defaultConfig, ...envConfig };
    
    // 从环境变量或本地存储中覆盖配置
    this.loadFromEnvironment();
  }

  public static getInstance(): ImageLoadConfigManager {
    if (!ImageLoadConfigManager.instance) {
      ImageLoadConfigManager.instance = new ImageLoadConfigManager();
    }
    return ImageLoadConfigManager.instance;
  }

  /**
   * 从环境变量加载配置
   */
  private loadFromEnvironment(): void {
    // 从环境变量中读取配置
    if (process.env.REACT_APP_IMAGE_TEST_TIMEOUT) {
      this.config.testTimeout = parseInt(process.env.REACT_APP_IMAGE_TEST_TIMEOUT);
    }
    
    if (process.env.REACT_APP_IMAGE_MAX_CONCURRENT) {
      this.config.maxConcurrent = parseInt(process.env.REACT_APP_IMAGE_MAX_CONCURRENT);
    }
    
    if (process.env.REACT_APP_IMAGE_CACHE_EXPIRY) {
      this.config.cacheExpiry = parseInt(process.env.REACT_APP_IMAGE_CACHE_EXPIRY);
    }
    
    if (process.env.REACT_APP_IMAGE_DEBUG_MODE) {
      this.config.enableDebugMode = process.env.REACT_APP_IMAGE_DEBUG_MODE === 'true';
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): ImageLoadConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  public updateConfig(updates: Partial<ImageLoadConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('📝 图片加载配置已更新:', updates);
  }

  /**
   * 重置为默认配置
   */
  public resetToDefault(): void {
    const envConfig = process.env.NODE_ENV === 'production' 
      ? productionConfig 
      : developmentConfig;
    
    this.config = { ...defaultConfig, ...envConfig };
    this.loadFromEnvironment();
    console.log('🔄 图片加载配置已重置为默认值');
  }

  /**
   * 获取性能相关配置
   */
  public getPerformanceConfig() {
    return {
      testTimeout: this.config.testTimeout,
      maxConcurrent: this.config.maxConcurrent,
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
      batchSize: this.config.batchSize,
    };
  }

  /**
   * 获取缓存相关配置
   */
  public getCacheConfig() {
    return {
      enableCache: this.config.enableCache,
      cacheExpiry: this.config.cacheExpiry,
      maxCacheSize: this.config.maxCacheSize,
    };
  }

  /**
   * 获取调试相关配置
   */
  public getDebugConfig() {
    return {
      enableDebugMode: this.config.enableDebugMode,
      enableDetailedLogs: this.config.enableDetailedLogs,
      enablePerformanceMonitoring: this.config.enablePerformanceMonitoring,
    };
  }

  /**
   * 导出配置用于调试
   */
  public exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }
}

// 导出配置管理器实例
export const imageLoadConfig = ImageLoadConfigManager.getInstance();

// 导出便捷方法
export const getImageLoadConfig = () => imageLoadConfig.getConfig();
export const updateImageLoadConfig = (updates: Partial<ImageLoadConfig>) => 
  imageLoadConfig.updateConfig(updates); 