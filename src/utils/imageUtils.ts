import { useState, useEffect, useMemo } from 'react';
import { ImageProxyService } from '../services/imageProxyService';
import { ImageUrlUtils } from './imageUrlUtils';

// 图片处理工具类
export class ImageUtils {
  
  /**
   * 解析和清理图片URL
   */
  static parseImageUrls(imageUrls: string[] | string | null | undefined): string[] {
    if (!imageUrls) return [];
    
    try {
      let urls: string[] = [];
      
      if (typeof imageUrls === 'string') {
        // 尝试解析JSON字符串
        try {
          const parsed = JSON.parse(imageUrls);
          urls = Array.isArray(parsed) ? parsed : [imageUrls];
        } catch {
          // 如果不是JSON，直接作为单个URL
          urls = imageUrls.trim() ? [imageUrls] : [];
        }
      } else if (Array.isArray(imageUrls)) {
        urls = imageUrls;
      }
      
      // 清理和验证URL
      return urls
        .filter(url => url && typeof url === 'string' && url.trim() !== '')
        .map(url => this.cleanImageUrl(url))
        .filter(url => this.isValidImageUrl(url));
        
    } catch (error) {
      console.error('解析图片URL失败:', error);
      return [];
    }
  }
  
  /**
   * 清理图片URL
   */
  static cleanImageUrl(url: string): string {
    try {
      // 移除多余的查询参数和锚点
      const cleanUrl = url.split('#')[0];
      
      // 特殊处理百度百科URL
      if (cleanUrl.includes('baike.baidu.com/pic/')) {
        // 提取实际图片URL
        const match = cleanUrl.match(/pic=([^&]+)/);
        if (match) {
          return decodeURIComponent(match[1]);
        }
      }
      
      return cleanUrl;
    } catch {
      return url;
    }
  }
  
  /**
   * 验证图片URL是否有效
   */
  static isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || 
             url.includes('image') || 
             url.includes('pic');
    } catch {
      return false;
    }
  }
  
  /**
   * 获取代理图片URL（使用新的代理服务）
   */
  static getProxyImageUrl(originalUrl: string): string {
    return ImageProxyService.getProxiedUrl(originalUrl);
  }
  
  /**
   * 生成备用图片URL列表（使用新的代理服务）
   */
  static generateFallbackUrls(originalUrl: string, locationName?: string): string[] {
    return ImageProxyService.getAllPossibleUrls(originalUrl, locationName);
  }
  
  /**
   * 预加载图片（使用代理服务的测试方法）
   */
  static preloadImage(url: string): Promise<boolean> {
    return ImageProxyService.testImageUrl(url, 8000);
  }
  
  /**
   * 获取默认占位图片
   */
  static getPlaceholderImage(locationName: string): string {
    return ImageProxyService.getPlaceholderImage(locationName);
  }

  /**
   * 获取随机风景图片作为备用
   */
  static getRandomLandscapeImage(locationName?: string): string {
    const seed = locationName ? locationName.charCodeAt(0).toString() : undefined;
    return ImageProxyService.getRandomLandscapeImage(400, 300, seed);
  }
}

/**
 * 增强的图片加载状态管理Hook
 */
export const useImageLoader = (urls: string[], locationName?: string) => {
  const [loadedUrls, setLoadedUrls] = useState<string[]>([]);
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState<{
    originalAttempts: number;
    proxyAttempts: number;
    successfulOriginals: number;
    totalProcessingTime: number;
  }>({ originalAttempts: 0, proxyAttempts: 0, successfulOriginals: 0, totalProcessingTime: 0 });
  
  // 使用 useMemo 来稳定化 urls 数组，避免无限循环
  const stableUrls = useMemo(() => urls, [JSON.stringify(urls)]);
  
  useEffect(() => {
    if (stableUrls.length === 0) {
      setIsLoading(false);
      return;
    }
    
    const loadImages = async () => {
      const startTime = Date.now();
      setIsLoading(true);
      setLoadingProgress(0);
      const loaded: string[] = [];
      const failed: string[] = [];
      let originalAttempts = 0;
      let proxyAttempts = 0;
      let successfulOriginals = 0;
      
      console.log(`🚀 开始加载 ${stableUrls.length} 张图片 for ${locationName || '未知位置'}`);
      
      try {
        // 优化：先测试所有原始URL，记录哪些可用
        const originalTestResults = new Map<string, boolean>();
        console.log(`📊 第一阶段：批量测试原始图片URL...`);
        
        for (let i = 0; i < stableUrls.length; i++) {
          const originalUrl = stableUrls[i];
          originalAttempts++;
          setLoadingProgress((i / stableUrls.length) * 40); // 前40%进度用于测试原始URL
          
          try {
            console.log(`🔍 测试原始图片 ${i + 1}/${stableUrls.length}: ${originalUrl.substring(0, 60)}...`);
            const isOriginalWorking = await ImageProxyService.testImageUrl(originalUrl, 5000);
            originalTestResults.set(originalUrl, isOriginalWorking);
            
            if (isOriginalWorking) {
              successfulOriginals++;
              console.log(`✅ 原始图片可用: ${originalUrl.substring(0, 60)}...`);
            } else {
              console.log(`❌ 原始图片不可用: ${originalUrl.substring(0, 60)}...`);
            }
          } catch (error) {
            console.warn(`⚠️ 测试原始图片时出错: ${error}`);
            originalTestResults.set(originalUrl, false);
          }
        }
        
        // 第二阶段：根据测试结果处理图片
        console.log(`📊 第二阶段：处理图片加载结果...`);
        console.log(`📈 原始图片成功率: ${successfulOriginals}/${stableUrls.length} (${((successfulOriginals / stableUrls.length) * 100).toFixed(1)}%)`);
        
        for (let i = 0; i < stableUrls.length; i++) {
          const originalUrl = stableUrls[i];
          const isOriginalWorking = originalTestResults.get(originalUrl);
          
          setLoadingProgress(40 + (i / stableUrls.length) * 60); // 后60%进度用于加载处理
          
          if (isOriginalWorking) {
            loaded.push(originalUrl);
            console.log(`✅ 使用原始图片 ${i + 1}: ${originalUrl.substring(0, 60)}...`);
          } else {
            console.log(`🔄 为失败图片寻找代理 ${i + 1}: ${originalUrl.substring(0, 60)}...`);
            proxyAttempts++;
            
            // 原始URL失败，尝试找到可用的代理URL
            const workingUrl = await ImageProxyService.findWorkingImageUrl(originalUrl, locationName);
            
            if (workingUrl && workingUrl !== originalUrl) {
              loaded.push(workingUrl);
              console.log(`✅ 代理图片加载成功 ${i + 1}: ${workingUrl.substring(0, 60)}...`);
            } else {
              failed.push(originalUrl);
              console.log(`❌ 图片完全失败 ${i + 1}: ${originalUrl.substring(0, 60)}...`);
            }
          }
        }
        
        const processingTime = Date.now() - startTime;
        
        setLoadedUrls(loaded);
        setFailedUrls(failed);
        setLoadingProgress(100);
        setDebugInfo({
          originalAttempts,
          proxyAttempts,
          successfulOriginals,
          totalProcessingTime: processingTime
        });
        
        // 统计日志
        console.log(`📊 图片加载完成统计:`);
        console.log(`   📍 位置: ${locationName || '未知位置'}`);
        console.log(`   📈 总计: ${stableUrls.length} 张图片`);
        console.log(`   ✅ 成功: ${loaded.length} 张 (${((loaded.length / stableUrls.length) * 100).toFixed(1)}%)`);
        console.log(`   ❌ 失败: ${failed.length} 张`);
        console.log(`   🎯 原始图片成功: ${successfulOriginals} 张`);
        console.log(`   🔄 代理尝试: ${proxyAttempts} 次`);
        console.log(`   ⏱️ 总耗时: ${processingTime}ms`);
        
        // 只有在所有图片都失败时才添加备用图片
        if (loaded.length === 0 && locationName) {
          console.log(`🎨 所有图片都失败，添加备用图片: ${locationName}`);
          const fallbackImage = ImageUtils.getPlaceholderImage(locationName);
          setLoadedUrls([fallbackImage]);
        }
        
      } catch (error) {
        console.error('❌ 批量加载图片失败:', error);
        setFailedUrls(stableUrls);
        
        // 添加占位图片
        if (locationName) {
          const placeholderImage = ImageUtils.getPlaceholderImage(locationName);
          setLoadedUrls([placeholderImage]);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImages();
  }, [stableUrls, locationName]);
  
  return { 
    loadedUrls, 
    failedUrls, 
    isLoading, 
    loadingProgress,
    hasImages: loadedUrls.length > 0,
    totalImages: stableUrls.length,
    successRate: stableUrls.length > 0 ? (loadedUrls.length / stableUrls.length) * 100 : 0,
    debugInfo // 新增调试信息
  };
};

/**
 * 单个图片加载Hook
 */
export const useSingleImageLoader = (url: string, locationName?: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadMethod, setLoadMethod] = useState<'original' | 'proxy' | 'fallback' | null>(null);
  
  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }
    
    const loadImage = async () => {
      const startTime = Date.now();
      setIsLoading(true);
      setHasError(false);
      setLoadMethod(null);
      
      console.log(`🔍 开始加载单个图片: ${url.substring(0, 80)}...`);
      
      try {
        // 先测试原始URL
        console.log(`🎯 测试原始图片URL...`);
        const isOriginalWorking = await ImageProxyService.testImageUrl(url, 5000);
        
        if (isOriginalWorking) {
          setImageUrl(url);
          setLoadMethod('original');
          const processingTime = Date.now() - startTime;
          console.log(`✅ 原始单图加载成功 (${processingTime}ms): ${url.substring(0, 80)}...`);
        } else {
          console.log(`❌ 原始单图加载失败，尝试代理...`);
          
          // 原始URL失败，尝试代理
          const workingUrl = await ImageProxyService.findWorkingImageUrl(url, locationName);
          
          if (workingUrl && workingUrl !== url) {
            setImageUrl(workingUrl);
            setLoadMethod('proxy');
            const processingTime = Date.now() - startTime;
            console.log(`✅ 代理单图加载成功 (${processingTime}ms): ${workingUrl.substring(0, 80)}...`);
          } else {
            setHasError(true);
            setLoadMethod('fallback');
            const processingTime = Date.now() - startTime;
            console.log(`❌ 所有代理都失败，使用占位图 (${processingTime}ms): ${url.substring(0, 80)}...`);
            
            // 所有真实图片都失败，使用占位图片
            const fallbackUrl = ImageUtils.getPlaceholderImage(locationName || '图片加载失败');
            setImageUrl(fallbackUrl);
          }
        }
      } catch (error) {
        console.error('❌ 加载图片失败:', error);
        setHasError(true);
        setLoadMethod('fallback');
        const fallbackUrl = ImageUtils.getPlaceholderImage(locationName || '图片加载失败');
        setImageUrl(fallbackUrl);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImage();
  }, [url, locationName]);
  
  return { 
    imageUrl, 
    isLoading, 
    hasError, 
    loadMethod // 新增：显示使用的加载方式
  };
};

/**
 * 解析图片URLs - 统一处理字符串和数组格式
 */
export const parseImageUrls = (imageUrls: string | string[]): string[] => {
  if (!imageUrls) return [];
  
  let urls: string[];
  if (typeof imageUrls === 'string') {
    try {
      // 尝试解析JSON格式的字符串
      urls = JSON.parse(imageUrls);
    } catch {
      // 如果不是JSON，按逗号分割
      urls = imageUrls.split(',').map(url => url.trim()).filter(Boolean);
    }
  } else {
    urls = imageUrls;
  }
  
  // 使用ImageUrlUtils处理URLs，确保正确的路径
  return ImageUrlUtils.processImageUrls(urls.filter(Boolean));
};

/**
 * 测试图片URL是否可访问
 */
export const testImageUrl = (url: string): Promise<{ url: string; success: boolean; width?: number; height?: number; loadTime: number }> => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    
    // 使用ImageUrlUtils获取测试URL
    const testUrl = ImageUrlUtils.getTestImageUrl(url);
    
    const img = new Image();
    
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      img.onabort = null;
    };
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      cleanup();
      resolve({ 
        url, 
        success: true, 
        width: img.naturalWidth, 
        height: img.naturalHeight,
        loadTime: Math.round(loadTime)
      });
    };
    
    img.onerror = () => {
      const loadTime = performance.now() - startTime;
      cleanup();
      resolve({ url, success: false, loadTime: Math.round(loadTime) });
    };
    
    img.onabort = () => {
      const loadTime = performance.now() - startTime;
      cleanup();
      resolve({ url, success: false, loadTime: Math.round(loadTime) });
    };
    
    img.src = testUrl;
    
    // 超时处理
    setTimeout(() => {
      if (img.complete === false) {
        const loadTime = performance.now() - startTime;
        cleanup();
        resolve({ url, success: false, loadTime: Math.round(loadTime) });
      }
    }, 8000);
  });
}; 