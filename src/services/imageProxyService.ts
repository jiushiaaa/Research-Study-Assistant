// 图片代理服务
import { imageLoadCache } from './imageLoadCache';

export class ImageProxyService {
  private static readonly PROXY_ENDPOINTS = [
    'https://images.weserv.nl/?url=',
    'https://imageproxy.pimg.tw/resize?url=',
    'https://cors-anywhere.herokuapp.com/',
  ];

  private static readonly FALLBACK_SERVICES = [
    'https://via.placeholder.com/400x300/f0f0f0/666666?text=',
    'https://picsum.photos/400/300?random=',
  ];

  /**
   * 获取代理后的图片URL
   */
  static getProxiedUrl(originalUrl: string, proxyIndex: number = 0): string {
    if (!originalUrl || proxyIndex >= this.PROXY_ENDPOINTS.length) {
      return originalUrl;
    }

    try {
      const proxyEndpoint = this.PROXY_ENDPOINTS[proxyIndex];
      
      // 特殊处理百度图片URL
      if (originalUrl.includes('baidu.com')) {
        const cleanUrl = this.cleanBaiduImageUrl(originalUrl);
        return `${proxyEndpoint}${encodeURIComponent(cleanUrl)}`;
      }

      return `${proxyEndpoint}${encodeURIComponent(originalUrl)}`;
    } catch (error) {
      console.warn('代理URL生成失败:', error);
      return originalUrl;
    }
  }

  /**
   * 清理百度图片URL
   */
  private static cleanBaiduImageUrl(url: string): string {
    try {
      // 提取百度图片的实际URL
      if (url.includes('baike.baidu.com/pic/')) {
        const match = url.match(/pic=([^&]+)/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }

      // 处理其他百度图片格式
      if (url.includes('bkimg.cdn.bcebos.com') || url.includes('baikebcs.bdimg.com')) {
        return url.split('?')[0]; // 移除查询参数
      }

      return url;
    } catch (error) {
      console.warn('清理百度URL失败:', error);
      return url;
    }
  }

  /**
   * 获取所有可能的图片URL（包括代理和备用）
   */
  static getAllPossibleUrls(originalUrl: string, locationName?: string): string[] {
    const urls: string[] = [];

    // 原始URL
    urls.push(originalUrl);

    // 代理URL
    this.PROXY_ENDPOINTS.forEach((_, index) => {
      const proxiedUrl = this.getProxiedUrl(originalUrl, index);
      if (proxiedUrl !== originalUrl) {
        urls.push(proxiedUrl);
      }
    });

    // 百度URL特殊处理
    if (originalUrl.includes('baidu.com')) {
      const cleanUrl = this.cleanBaiduImageUrl(originalUrl);
      if (cleanUrl !== originalUrl) {
        urls.push(cleanUrl);
        // 为清理后的URL也添加代理
        this.PROXY_ENDPOINTS.forEach((_, index) => {
          const proxiedCleanUrl = this.getProxiedUrl(cleanUrl, index);
          urls.push(proxiedCleanUrl);
        });
      }
    }

    // 备用占位图片
    if (locationName) {
      const placeholderText = encodeURIComponent(locationName);
      this.FALLBACK_SERVICES.forEach(service => {
        urls.push(`${service}${placeholderText}`);
      });
    }

    // 去重
    return Array.from(new Set(urls));
  }

  /**
   * 测试图片URL是否可访问（增强版，带缓存）
   */
  static async testImageUrl(url: string, timeout: number = 5000): Promise<boolean> {
    // 首先检查缓存
    const cachedResult = imageLoadCache.get(url);
    if (cachedResult !== null) {
      return cachedResult;
    }

    const testStartTime = Date.now();
    
    return new Promise((resolve) => {
      const img = new Image();
      let resolved = false;
      
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          img.onload = null;
          img.onerror = null;
          img.onabort = null;
          
          const testDuration = Date.now() - testStartTime;
          console.log(`⏰ 图片测试超时 (${timeout}ms): ${url.substring(0, 60)}...`);
          
          // 缓存超时结果
          imageLoadCache.set(url, false, testDuration);
          resolve(false);
        }
      }, timeout);

      img.onload = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          
          const testDuration = Date.now() - testStartTime;
          
          // 检查图片是否真的加载成功（非空图片）
          if (img.width > 0 && img.height > 0) {
            console.log(`✅ 图片测试成功 (${img.width}x${img.height}, ${testDuration}ms): ${url.substring(0, 60)}...`);
            imageLoadCache.set(url, true, testDuration);
            resolve(true);
          } else {
            console.log(`❌ 图片测试失败 (空图片, ${testDuration}ms): ${url.substring(0, 60)}...`);
            imageLoadCache.set(url, false, testDuration);
            resolve(false);
          }
        }
      };

      img.onerror = (e) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          
          const testDuration = Date.now() - testStartTime;
          console.log(`❌ 图片测试失败 (错误, ${testDuration}ms): ${url.substring(0, 60)}...`, e);
          
          // 缓存失败结果
          imageLoadCache.set(url, false, testDuration);
          resolve(false);
        }
      };

      img.onabort = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          
          const testDuration = Date.now() - testStartTime;
          console.log(`❌ 图片测试中断 (${testDuration}ms): ${url.substring(0, 60)}...`);
          
          // 缓存中断结果
          imageLoadCache.set(url, false, testDuration);
          resolve(false);
        }
      };

      // 设置跨域属性
      img.crossOrigin = 'anonymous';
      
      // 添加缓存破坏参数以避免缓存影响测试结果
      const testUrl = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
      img.src = testUrl;
    });
  }

  /**
   * 找到第一个可用的图片URL（不包含占位图片）
   */
  static async findWorkingImageUrl(
    originalUrl: string, 
    locationName?: string
  ): Promise<string | null> {
    const urls: string[] = [];

    // 原始URL（虽然这里传入，但调用方已经测试过了）
    urls.push(originalUrl);

    // 代理URL
    this.PROXY_ENDPOINTS.forEach((_, index) => {
      const proxiedUrl = this.getProxiedUrl(originalUrl, index);
      if (proxiedUrl !== originalUrl) {
        urls.push(proxiedUrl);
      }
    });

    // 百度URL特殊处理
    if (originalUrl.includes('baidu.com')) {
      const cleanUrl = this.cleanBaiduImageUrl(originalUrl);
      if (cleanUrl !== originalUrl) {
        urls.push(cleanUrl);
        // 为清理后的URL也添加代理
        this.PROXY_ENDPOINTS.forEach((_, index) => {
          const proxiedCleanUrl = this.getProxiedUrl(cleanUrl, index);
          urls.push(proxiedCleanUrl);
        });
      }
    }

    // 注意：这里不包含占位图片，只测试真实的图片URL

    for (const url of urls) {
      try {
        const isWorking = await this.testImageUrl(url);
        if (isWorking) {
          return url;
        }
      } catch (error) {
        console.warn(`测试图片URL失败: ${url}`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * 批量处理图片URL
   */
  static async processBatchUrls(
    urls: string[], 
    locationName?: string,
    maxConcurrent: number = 3
  ): Promise<{ working: string[], failed: string[] }> {
    const working: string[] = [];
    const failed: string[] = [];

    // 分批处理，避免同时发起太多请求
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const promises = batch.map(async (url) => {
        const workingUrl = await this.findWorkingImageUrl(url, locationName);
        return { original: url, working: workingUrl };
      });

      const results = await Promise.all(promises);
      
      results.forEach(({ original, working: workingUrl }) => {
        if (workingUrl) {
          working.push(workingUrl);
        } else {
          failed.push(original);
        }
      });
    }

    return { working, failed };
  }

  /**
   * 获取默认占位图片
   */
  static getPlaceholderImage(
    locationName: string = '暂无图片',
    width: number = 400,
    height: number = 300,
    backgroundColor: string = 'f0f0f0',
    textColor: string = '666666'
  ): string {
    const text = encodeURIComponent(locationName);
    return `https://via.placeholder.com/${width}x${height}/${backgroundColor}/${textColor}?text=${text}`;
  }

  /**
   * 生成随机风景图片（作为备用）
   */
  static getRandomLandscapeImage(
    width: number = 400,
    height: number = 300,
    seed?: string
  ): string {
    const randomSeed = seed || Math.random().toString(36).substring(7);
    return `https://picsum.photos/${width}/${height}?random=${randomSeed}`;
  }
} 