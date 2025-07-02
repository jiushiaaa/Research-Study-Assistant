import React, { useState } from 'react';
import { Image, Carousel, Skeleton, Empty, Badge, Tooltip, Progress } from 'antd';
import { PictureOutlined, EyeOutlined, LoadingOutlined, ExclamationCircleOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useImageLoader } from '../../utils/imageUtils';
import { ImageUrlUtils } from '../../utils/imageUrlUtils';
import ImageLoadDebugPanel from './ImageLoadDebugPanel';
import './LocationImageDisplay.css';

interface LocationImageDisplayProps {
  imageUrls: string[] | string;
  locationName: string;
  className?: string;
  height?: number | string;
  width?: number | string;
  showPreview?: boolean;
  showCarousel?: boolean;
  showBadge?: boolean;
  autoPlay?: boolean;
  placeholder?: React.ReactNode;
  showProgress?: boolean;
  showDebugInfo?: boolean;
  showNavigationControls?: boolean;
  showImageInfo?: boolean;
  autoSlideInterval?: number;
  onImageClick?: (index: number) => void;
  onImageLoad?: (index: number) => void;
  onImageError?: (index: number) => void;
}

const LocationImageDisplay: React.FC<LocationImageDisplayProps> = ({
  imageUrls,
  locationName,
  className = '',
  height = 200,
  width = '100%',
  showPreview = true,
  showCarousel = true,
  showBadge = true,
  autoPlay = false,
  placeholder,
  showProgress = true,
  showDebugInfo = false,
  showNavigationControls = true,
  showImageInfo = true,
  autoSlideInterval = 0,
  onImageClick,
  onImageLoad,
  onImageError
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 解析图片URLs
  const parsedUrls = ImageUrlUtils.processImageUrls(
    typeof imageUrls === 'string' 
      ? (imageUrls.includes(',') ? imageUrls.split(',').map(url => url.trim()) : [imageUrls])
      : imageUrls
  ).filter(Boolean);
  
  // 使用增强的图片加载Hook
  const { 
    loadedUrls, 
    failedUrls, 
    isLoading, 
    loadingProgress,
    hasImages,
    successRate,
    debugInfo
  } = useImageLoader(parsedUrls, locationName);
  
  // 如果没有图片或全部加载失败
  if (parsedUrls.length === 0 || (!hasImages && !isLoading)) {
    return (
      <div 
        className={`location-image-display no-images ${className}`}
        style={{ height, width }}
      >
        {placeholder || (
          <Empty
            image={<PictureOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
            description={
              <span style={{ color: '#999' }}>
                {failedUrls.length > 0 ? '图片加载失败' : '暂无图片'}
              </span>
            }
          />
        )}
      </div>
    );
  }

  // 加载中状态
  if (isLoading) {
    return (
      <div 
        className={`location-image-display loading ${className}`}
        style={{ height, width }}
      >
        <Skeleton.Image 
          style={{ width: '100%', height: '100%' }} 
          active 
        />
        <div className="loading-overlay">
          <LoadingOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <span style={{ marginLeft: 8, color: '#666' }}>
            正在加载图片...
          </span>
          {showProgress && (
            <Progress 
              percent={loadingProgress} 
              size="small" 
              style={{ marginTop: 8, width: 120 }}
              showInfo={false}
            />
          )}
          {showDebugInfo && debugInfo && (
            <div style={{ 
              marginTop: 8, 
              fontSize: 11, 
              color: '#999',
              textAlign: 'center'
            }}>
              原始: {debugInfo.successfulOriginals}/{debugInfo.originalAttempts} | 
              代理: {debugInfo.proxyAttempts} | 
              耗时: {debugInfo.totalProcessingTime}ms
            </div>
          )}
        </div>
      </div>
    );
  }

  // 单张图片展示
  if (loadedUrls.length === 1) {
    return (
      <div 
        className={`location-image-display single-image ${className}`}
        style={{ height, width }}
      >
        <Image
          src={loadedUrls[0]}
          alt={locationName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          preview={showPreview ? {
            mask: (
              <div className="image-preview-mask">
                <EyeOutlined style={{ fontSize: 20 }} />
                <span style={{ marginLeft: 8 }}>预览</span>
              </div>
            )
          } : false}
          fallback="/api/placeholder/400/300"
          placeholder={
            <Skeleton.Image 
              style={{ width: '100%', height: '100%' }} 
              active 
            />
          }
        />
        {showBadge && (
          <Badge 
            count={
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {successRate === 100 ? (
                  <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                ) : (
                  <ExclamationCircleOutlined style={{ marginRight: 4, color: '#faad14' }} />
                )}
                1 张图片
                {showDebugInfo && debugInfo && (
                  <InfoCircleOutlined 
                    style={{ marginLeft: 4, fontSize: 10 }} 
                    title={`加载详情: 原始${debugInfo.successfulOriginals}/${debugInfo.originalAttempts}, 代理${debugInfo.proxyAttempts}, 耗时${debugInfo.totalProcessingTime}ms`}
                  />
                )}
              </span>
            } 
            style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              border: 'none'
            }} 
          />
        )}
        {failedUrls.length > 0 && (
          <Tooltip title={`${failedUrls.length} 张图片加载失败，成功率: ${successRate.toFixed(0)}%`}>
            <ExclamationCircleOutlined 
              style={{ 
                position: 'absolute', 
                bottom: 8, 
                right: 8,
                color: '#faad14',
                fontSize: 16
              }} 
            />
          </Tooltip>
        )}
      </div>
    );
  }

  // 多张图片轮播展示
  if (showCarousel && loadedUrls.length > 1) {
    return (
      <div 
        className={`location-image-display carousel ${className}`}
        style={{ height, width }}
      >
        <Carousel
          autoplay={autoPlay}
          dots={true}
          effect="fade"
          beforeChange={(from, to) => setCurrentImageIndex(to)}
        >
          {loadedUrls.map((url, index) => (
            <div key={index} className="carousel-slide">
              <Image
                src={url}
                alt={`${locationName} - 图片 ${index + 1}`}
                style={{ width: '100%', height: height, objectFit: 'cover' }}
                preview={showPreview ? {
                  mask: (
                    <div className="image-preview-mask">
                      <EyeOutlined style={{ fontSize: 20 }} />
                      <span style={{ marginLeft: 8 }}>预览</span>
                    </div>
                  )
                } : false}
                fallback="/api/placeholder/400/300"
                placeholder={
                  <Skeleton.Image 
                    style={{ width: '100%', height: height }} 
                    active 
                  />
                }
              />
            </div>
          ))}
        </Carousel>
        
        {showBadge && (
          <Badge 
            count={
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {successRate >= 80 ? (
                  <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a' }} />
                ) : successRate >= 50 ? (
                  <ExclamationCircleOutlined style={{ marginRight: 4, color: '#faad14' }} />
                ) : (
                  <ExclamationCircleOutlined style={{ marginRight: 4, color: '#ff4d4f' }} />
                )}
                {loadedUrls.length} 张图片
              </span>
            } 
            style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              border: 'none',
              zIndex: 10
            }} 
          />
        )}
        
        <div className="carousel-indicator">
          <span style={{ 
            position: 'absolute', 
            bottom: 8, 
            left: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            zIndex: 10
          }}>
            {currentImageIndex + 1} / {loadedUrls.length}
          </span>
        </div>
        
        {failedUrls.length > 0 && (
          <Tooltip title={`${failedUrls.length} 张图片加载失败，成功率: ${successRate.toFixed(0)}%`}>
            <ExclamationCircleOutlined 
              style={{ 
                position: 'absolute', 
                bottom: 8, 
                right: 8,
                color: successRate >= 50 ? '#faad14' : '#ff4d4f',
                fontSize: 16,
                zIndex: 10
              }} 
            />
          </Tooltip>
        )}
      </div>
    );
  }

  // 网格展示（多张图片但不使用轮播）
  return (
    <div 
      className={`location-image-display grid ${className}`}
      style={{ height, width }}
    >
      <div className="image-grid">
        {loadedUrls.slice(0, 4).map((url, index) => (
          <div key={index} className="grid-item">
            <Image
              src={url}
              alt={`${locationName} - 图片 ${index + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              preview={showPreview ? {
                mask: (
                  <div className="image-preview-mask">
                    <EyeOutlined style={{ fontSize: 16 }} />
                  </div>
                )
              } : false}
              fallback="/api/placeholder/400/300"
              placeholder={
                <Skeleton.Image 
                  style={{ width: '100%', height: '100%' }} 
                  active 
                />
              }
            />
            {index === 3 && loadedUrls.length > 4 && (
              <div className="more-overlay">
                <span>+{loadedUrls.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {showBadge && (
        <Badge 
          count={
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {successRate >= 80 ? (
                <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a' }} />
              ) : successRate >= 50 ? (
                <ExclamationCircleOutlined style={{ marginRight: 4, color: '#faad14' }} />
              ) : (
                <ExclamationCircleOutlined style={{ marginRight: 4, color: '#ff4d4f' }} />
              )}
              {loadedUrls.length} 张图片
            </span>
          } 
          style={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            border: 'none',
            zIndex: 10
          }} 
        />
      )}
      
      {failedUrls.length > 0 && (
        <Tooltip title={`${failedUrls.length} 张图片加载失败，成功率: ${successRate.toFixed(0)}%`}>
          <ExclamationCircleOutlined 
            style={{ 
              position: 'absolute', 
              bottom: 8, 
              right: 8,
              color: successRate >= 50 ? '#faad14' : '#ff4d4f',
              fontSize: 16,
              zIndex: 10
            }} 
          />
        </Tooltip>
      )}
    </div>
  );
};

// 导出带调试面板的高级版本
export const LocationImageDisplayWithDebug: React.FC<LocationImageDisplayProps> = (props) => {
  const [showDebugPanel] = useState(false);
  
  return (
    <div>
      <LocationImageDisplay {...props} showDebugInfo={showDebugPanel} />
      {showDebugPanel && (
        <ImageLoadDebugPanel
          locationName={props.locationName}
          totalImages={Array.isArray(props.imageUrls) ? props.imageUrls.length : 1}
          loadedUrls={[]}
          failedUrls={[]}
          successRate={0}
          debugInfo={{
            originalAttempts: 0,
            proxyAttempts: 0,
            successfulOriginals: 0,
            totalProcessingTime: 0
          }}
        />
      )}
    </div>
  );
};

export default LocationImageDisplay; 