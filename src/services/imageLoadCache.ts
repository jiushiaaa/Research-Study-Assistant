/**
 * 图片加载缓存管理器
 * 用于缓存图片URL的测试结果，避免重复测试相同的URL
 */

interface CacheEntry {
  url: string;
  isWorking: boolean;
  timestamp: number;
  testDuration: number;
}

interface CacheStats {
  totalEntries: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
}

export class ImageLoadCache {
  private static instance: ImageLoadCache;
  private cache: Map<string, CacheEntry> = new Map();
  private hitCount = 0;
  private missCount = 0;
  
  // 缓存过期时间（毫秒）- 默认30分钟
  private readonly CACHE_EXPIRY = 30 * 60 * 1000;
  
  // 最大缓存条目数
  private readonly MAX_CACHE_SIZE = 1000;

  private constructor() {
    // 私有构造函数实现单例模式
  }

  public static getInstance(): ImageLoadCache {
    if (!ImageLoadCache.instance) {
      ImageLoadCache.instance = new ImageLoadCache();
    }
    return ImageLoadCache.instance;
  }

  /**
   * 生成缓存key
   */
  private getCacheKey(url: string): string {
    // 移除查询参数中的时间戳，避免缓存失效
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.delete('_t');
      urlObj.searchParams.delete('timestamp');
      return urlObj.toString();
    } catch {
      // 如果URL解析失败，直接使用原始URL
      return url.split('?_t=')[0].split('?timestamp=')[0];
    }
  }

  /**
   * 检查缓存中是否存在有效的条目
   */
  public has(url: string): boolean {
    const key = this.getCacheKey(url);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // 检查是否过期
    const now = Date.now();
    if (now - entry.timestamp > this.CACHE_EXPIRY) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 获取缓存的测试结果
   */
  public get(url: string): boolean | null {
    const key = this.getCacheKey(url);
    
    if (!this.has(url)) {
      this.missCount++;
      console.log(`🔍 缓存未命中: ${url.substring(0, 60)}...`);
      return null;
    }
    
    const entry = this.cache.get(key)!;
    this.hitCount++;
    console.log(`⚡ 缓存命中 (${entry.isWorking ? '✅' : '❌'}): ${url.substring(0, 60)}...`);
    return entry.isWorking;
  }

  /**
   * 设置缓存条目
   */
  public set(url: string, isWorking: boolean, testDuration: number = 0): void {
    const key = this.getCacheKey(url);
    
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }
    
    const entry: CacheEntry = {
      url: key,
      isWorking,
      timestamp: Date.now(),
      testDuration
    };
    
    this.cache.set(key, entry);
    console.log(`💾 缓存已保存 (${isWorking ? '✅' : '❌'}): ${url.substring(0, 60)}...`);
  }

  /**
   * 删除最旧的缓存条目
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();
    
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`🗑️ 删除最旧缓存条目: ${oldestKey.substring(0, 60)}...`);
    }
  }

  /**
   * 清空缓存
   */
  public clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    console.log('🧹 图片加载缓存已清空');
  }

  /**
   * 获取缓存统计信息
   */
  public getStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount;
    return {
      totalEntries: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate: totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0
    };
  }

  /**
   * 获取缓存中的工作URL数量
   */
  public getWorkingUrlCount(): number {
    return Array.from(this.cache.values()).filter(entry => entry.isWorking).length;
  }

  /**
   * 获取缓存中的失败URL数量
   */
  public getFailedUrlCount(): number {
    return Array.from(this.cache.values()).filter(entry => !entry.isWorking).length;
  }

  /**
   * 清理过期的缓存条目
   */
  public cleanupExpired(): number {
    const now = Date.now();
    let cleaned = 0;
    
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.CACHE_EXPIRY) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧽 清理了 ${cleaned} 个过期缓存条目`);
    }
    
    return cleaned;
  }

  /**
   * 导出缓存数据（用于调试）
   */
  public exportCache(): Array<CacheEntry & { cacheKey: string }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      ...entry,
      cacheKey: key
    }));
  }

  /**
   * 获取缓存详细信息（用于调试）
   */
  public getDebugInfo() {
    const stats = this.getStats();
    const workingCount = this.getWorkingUrlCount();
    const failedCount = this.getFailedUrlCount();
    
    return {
      ...stats,
      workingCount,
      failedCount,
      cacheSize: this.cache.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
      cacheExpiry: this.CACHE_EXPIRY
    };
  }
}

// 导出单例实例
export const imageLoadCache = ImageLoadCache.getInstance(); 