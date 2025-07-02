import { useState, useEffect } from 'react';

// 高德地图API密钥 - 实际应用中应存储在环境变量中
const AMAP_KEY = process.env.REACT_APP_AMAP_KEY || 'your_amap_key';

// 真实调用高德地图API获取POI信息和图片
export const fetchRealAmapImages = async (
  keywords: string,
  city: string = '上海',
  apiKey: string
): Promise<string[]> => {
  try {
    // 高德地图POI搜索API
    const url = `https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(keywords)}&city=${encodeURIComponent(city)}&output=json&offset=20&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.pois || data.pois.length === 0) {
      return [];
    }
    
    // 从POI数据中提取图片URL
    const images: string[] = [];
    
    for (const poi of data.pois) {
      if (poi.photos && poi.photos.length > 0) {
        for (const photo of poi.photos) {
          if (photo.url) {
            images.push(photo.url);
          }
        }
      }
    }
    
    return images;
  } catch (error) {
    console.error('高德地图API调用失败:', error);
    return [];
  }
};

// 模拟从高德地图API获取图片的函数
export const fetchImagesForLandmark = async (
  landmarkName: string,
  location: string,
  fallbackImages: string[] = []
): Promise<string[]> => {
  try {
    // 使用真实的高德地图API（如果有API密钥）
    if (AMAP_KEY && AMAP_KEY !== 'your_amap_key') {
      const realImages = await fetchRealAmapImages(landmarkName, '上海', AMAP_KEY);
      if (realImages.length > 0) {
        return realImages;
      }
    }
    
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 800));

    // 高德地图返回的景点图片URLs (模拟数据)
    const amapImageCollections: Record<string, string[]> = {
      '多伦路文化名人街': [
        'https://store.is.autonavi.com/showpic/322d5c37cb6c19ca350846eac470fbef',
        'https://store.is.autonavi.com/showpic/24ecf39a89aea2c6fc1e272c71ef0c94', 
        'https://store.is.autonavi.com/showpic/846faf4f5fce5c8c26374a1a78916171',
        'https://store.is.autonavi.com/showpic/e07413461f7150deb79642e0a1be5826',
        'https://store.is.autonavi.com/showpic/067e42a8a2b916f8ea17833e1dfced0a'
      ],
      '鲁迅公园与墓': [
        'https://store.is.autonavi.com/showpic/dbba34f11f84640dc5a7956c86392d62',
        'https://store.is.autonavi.com/showpic/a02970f18c26728e2e944686f21c098f',
        'https://store.is.autonavi.com/showpic/a16e1a3aec44683eaa8107b9d5fb40be',
        'https://store.is.autonavi.com/showpic/c6ec4c7c1d5743fbf946331ea251e935',
        'https://store.is.autonavi.com/showpic/7d33661e0bdec4b7425eed0c03e86b8a'
      ],
      '1933老场坊': [
        'https://store.is.autonavi.com/showpic/250ed19cd39e98c1dd9baa9b87f433e1',
        'https://store.is.autonavi.com/showpic/e07d5d7cabc2bb36fc4f8f9cfbc941e9',
        'https://store.is.autonavi.com/showpic/92088e5a4d1ae2770e14d3836140e80e',
        'https://store.is.autonavi.com/showpic/68f0cfc5a13a26d72c5c1f4195321878',
        'https://store.is.autonavi.com/showpic/d9a9448c4b1c5d406adb1ba0fa74af1a'
      ]
    };

    // 返回该景点的图片集合，如果没有找到则返回默认值
    return amapImageCollections[landmarkName] || fallbackImages;
  } catch (error) {
    console.error('获取高德地图图片失败:', error);
    return fallbackImages;
  }
};

// 自定义Hook，用于组件中获取图片
export const useImageFetching = (landmarkName: string, location: string, fallbackImages: string[] = []) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchImages = async () => {
      try {
        setLoading(true);
        const fetchedImages = await fetchImagesForLandmark(landmarkName, location, fallbackImages);
        
        if (isMounted) {
          setImages(fetchedImages);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error occurred'));
          setLoading(false);
        }
      }
    };

    fetchImages();

    return () => {
      isMounted = false;
    };
  }, [landmarkName, location, fallbackImages]);

  return { images, loading, error };
}; 