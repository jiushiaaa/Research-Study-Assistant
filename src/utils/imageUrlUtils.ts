/**
 * 图片URL处理工具
 * 用于处理后端图片URL的构建和验证
 */

import config from '../config/env';

export class ImageUrlUtils {
  
  /**
   * 获取后端服务器基础URL（不含API路径）
   */
  private static getServerBaseUrl(): string {
    // 从API URL中提取服务器基础URL
    const apiUrl = config.apiBaseUrl; // http://localhost:8080/api/v1
    const url = new URL(apiUrl);
    return `${url.protocol}//${url.host}`; // http://localhost:8080
  }

  /**
   * 处理图片URL，确保能正确访问
   * @param imageUrl 原始图片URL
   * @returns 处理后的完整图片URL
   */
  static processImageUrl(imageUrl: string): string {
    if (!imageUrl) return '';
    
    // 如果已经是完整的HTTP/HTTPS URL，直接返回
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // 如果是相对路径，添加服务器基础URL
    const serverBaseUrl = this.getServerBaseUrl();
    
    let finalPath = '';
    
    // 特殊处理：将 /image/ 路径转换为 /api/v1/test-image/ 路径
    if (imageUrl.startsWith('/image/')) {
      // 提取 /image/ 后面的部分，例如：/image/1933老场坊/1.jpg → 1933老场坊/1.jpg
      const pathAfterImage = imageUrl.substring('/image/'.length);
      finalPath = `/api/v1/test-image/${pathAfterImage}`;
    } else {
      // 确保路径以/开头
      finalPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
    }
    
    return `${serverBaseUrl}${finalPath}`;
  }

  /**
   * 批量处理图片URL
   * @param imageUrls 图片URL数组
   * @returns 处理后的图片URL数组
   */
  static processImageUrls(imageUrls: string[]): string[] {
    return imageUrls.map(url => this.processImageUrl(url));
  }

  /**
   * 验证图片URL是否有效
   * @param imageUrl 图片URL
   * @returns 是否为有效的图片URL
   */
  static isValidImageUrl(imageUrl: string): boolean {
    if (!imageUrl) return false;
    
    try {
      // 处理后的URL应该能正确解析
      const processedUrl = this.processImageUrl(imageUrl);
      new URL(processedUrl);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取图片的缩略图URL（如果支持）
   * @param imageUrl 原始图片URL
   * @param width 宽度
   * @param height 高度
   * @returns 缩略图URL
   */
  static getThumbnailUrl(imageUrl: string, width: number = 400, height: number = 300): string {
    const processedUrl = this.processImageUrl(imageUrl);
    
    // 如果是本地图片，暂时返回原图
    // 后续可以添加缩略图生成逻辑
    return processedUrl;
  }

  /**
   * 获取用于测试的图片URL（添加时间戳避免缓存）
   * @param imageUrl 原始图片URL
   * @returns 测试用图片URL
   */
  static getTestImageUrl(imageUrl: string): string {
    const processedUrl = this.processImageUrl(imageUrl);
    const separator = processedUrl.includes('?') ? '&' : '?';
    return `${processedUrl}${separator}_t=${Date.now()}`;
  }

  /**
   * 清理图片URL（移除测试参数）
   * @param imageUrl 图片URL
   * @returns 清理后的图片URL
   */
  static cleanImageUrl(imageUrl: string): string {
    try {
      const url = new URL(imageUrl);
      url.searchParams.delete('_t');
      url.searchParams.delete('timestamp');
      return url.toString();
    } catch {
      return imageUrl;
    }
  }

  /**
   * 检查是否为本地图片URL
   * @param imageUrl 图片URL
   * @returns 是否为本地图片
   */
  static isLocalImage(imageUrl: string): boolean {
    const processedUrl = this.processImageUrl(imageUrl);
    const serverBaseUrl = this.getServerBaseUrl();
    return processedUrl.startsWith(serverBaseUrl);
  }

  /**
   * 获取图片文件名
   * @param imageUrl 图片URL
   * @returns 文件名
   */
  static getImageFileName(imageUrl: string): string {
    try {
      const url = new URL(this.processImageUrl(imageUrl));
      const pathname = url.pathname;
      return pathname.split('/').pop() || '';
    } catch {
      return '';
    }
  }

  /**
   * 获取占位符图片
   * @param locationName 地点名称
   * @returns 占位符图片URL
   */
  static getPlaceholderImage(locationName: string): string {
    // 返回一个通用的占位符图片URL
    return `/api/placeholder/400/300?text=${encodeURIComponent(locationName || '暂无图片')}`;
  }
} 