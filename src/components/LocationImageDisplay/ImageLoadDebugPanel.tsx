import React, { useState } from 'react';
import { Card, Collapse, Tag, Progress, Button, Space, Typography } from 'antd';
import { 
  CheckCircleOutlined, 
  ReloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';

const { Panel } = Collapse;
const { Text } = Typography;

interface ImageLoadDebugInfo {
  originalAttempts: number;
  proxyAttempts: number;
  successfulOriginals: number;
  totalProcessingTime: number;
}

interface ImageLoadDebugPanelProps {
  locationName: string;
  totalImages: number;
  loadedUrls: string[];
  failedUrls: string[];
  successRate: number;
  debugInfo: ImageLoadDebugInfo;
  isLoading?: boolean;
  onReload?: () => void;
  className?: string;
}

const ImageLoadDebugPanel: React.FC<ImageLoadDebugPanelProps> = ({
  locationName,
  totalImages,
  loadedUrls,
  failedUrls,
  successRate,
  debugInfo,
  isLoading = false,
  onReload,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPerformanceLevel = (time: number) => {
    if (time < 1000) return { level: 'excellent', color: '#52c41a', text: '优秀' };
    if (time < 3000) return { level: 'good', color: '#1890ff', text: '良好' };
    if (time < 5000) return { level: 'fair', color: '#faad14', text: '一般' };
    return { level: 'poor', color: '#ff4d4f', text: '较差' };
  };

  const performance = getPerformanceLevel(debugInfo.totalProcessingTime);

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return '#52c41a';
    if (rate >= 50) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <Card
      className={`image-debug-panel ${className}`}
      size="small"
      style={{ 
        marginTop: 12,
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        background: '#fafafa'
      }}
      title={
        <Space>
          <BarChartOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>图片加载监控</span>
          <Tag color={performance.color} style={{ margin: 0 }}>
            {performance.text}
          </Tag>
        </Space>
      }
      extra={
        <Space size={4}>
          {onReload && (
            <Button 
              type="text" 
              size="small" 
              icon={<ReloadOutlined />}
              loading={isLoading}
              onClick={onReload}
              style={{ padding: '2px 6px' }}
            />
          )}
          <Button 
            type="text" 
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ padding: '2px 6px' }}
          >
            {isExpanded ? '收起' : '详情'}
          </Button>
        </Space>
      }
    >
      {/* 概览信息 */}
      <div style={{ marginBottom: 12 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666' }}>位置:</Text>
            <Text style={{ fontSize: 12, fontWeight: 500 }}>{locationName}</Text>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666' }}>成功率:</Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Progress 
                percent={successRate} 
                size="small" 
                strokeColor={getSuccessRateColor(successRate)}
                style={{ width: 60, margin: 0 }}
                showInfo={false}
              />
              <Text style={{ fontSize: 12, color: getSuccessRateColor(successRate), fontWeight: 500 }}>
                {successRate.toFixed(0)}%
              </Text>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666' }}>耗时:</Text>
            <Text style={{ fontSize: 12, color: performance.color, fontWeight: 500 }}>
              {debugInfo.totalProcessingTime}ms
            </Text>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#666' }}>图片统计:</Text>
            <Space size={4}>
              <Tag color="green" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                成功 {loadedUrls.length}
              </Tag>
              {failedUrls.length > 0 && (
                <Tag color="red" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                  失败 {failedUrls.length}
                </Tag>
              )}
            </Space>
          </div>
        </Space>
      </div>

      {/* 详细信息 */}
      {isExpanded && (
        <Collapse ghost size="small">
          <Panel 
            header={
              <Text style={{ fontSize: 12, fontWeight: 500 }}>
                详细统计
              </Text>
            } 
            key="stats"
          >
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <div>
                <Text style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>
                  加载策略分析:
                </Text>
                <Space wrap size={4}>
                  <Tag 
                    icon={<CheckCircleOutlined />} 
                    color="green" 
                    style={{ fontSize: 10, margin: 0 }}
                  >
                    原始成功: {debugInfo.successfulOriginals}/{debugInfo.originalAttempts}
                  </Tag>
                  <Tag 
                    icon={<ReloadOutlined />} 
                    color="blue" 
                    style={{ fontSize: 10, margin: 0 }}
                  >
                    代理尝试: {debugInfo.proxyAttempts}
                  </Tag>
                </Space>
              </div>

              <div>
                <Text style={{ fontSize: 11, color: '#666', display: 'block', marginBottom: 4 }}>
                  性能指标:
                </Text>
                <Space direction="vertical" style={{ width: '100%' }} size={2}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: '#999' }}>平均每张耗时:</Text>
                    <Text style={{ fontSize: 10, color: performance.color }}>
                      {totalImages > 0 ? Math.round(debugInfo.totalProcessingTime / totalImages) : 0}ms
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: '#999' }}>原始图片命中率:</Text>
                    <Text style={{ fontSize: 10, color: '#52c41a' }}>
                      {debugInfo.originalAttempts > 0 
                        ? ((debugInfo.successfulOriginals / debugInfo.originalAttempts) * 100).toFixed(0)
                        : 0}%
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, color: '#999' }}>代理使用率:</Text>
                    <Text style={{ fontSize: 10, color: '#1890ff' }}>
                      {totalImages > 0 
                        ? ((debugInfo.proxyAttempts / totalImages) * 100).toFixed(0)
                        : 0}%
                    </Text>
                  </div>
                </Space>
              </div>
            </Space>
          </Panel>

          {failedUrls.length > 0 && (
            <Panel 
              header={
                <Text style={{ fontSize: 12, fontWeight: 500, color: '#ff4d4f' }}>
                  失败的图片 ({failedUrls.length})
                </Text>
              } 
              key="failed"
            >
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                {failedUrls.slice(0, 3).map((url, index) => (
                  <div key={index} style={{ 
                    padding: 6, 
                    background: '#fff2f0', 
                    borderRadius: 4, 
                    border: '1px solid #ffccc7' 
                  }}>
                    <Text style={{ fontSize: 10, color: '#cf1322', wordBreak: 'break-all' }}>
                      {url.length > 80 ? `${url.substring(0, 80)}...` : url}
                    </Text>
                  </div>
                ))}
                {failedUrls.length > 3 && (
                  <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
                    ... 还有 {failedUrls.length - 3} 个失败的图片
                  </Text>
                )}
              </Space>
            </Panel>
          )}

          <Panel 
            header={
              <Text style={{ fontSize: 12, fontWeight: 500, color: '#52c41a' }}>
                成功的图片 ({loadedUrls.length})
              </Text>
            } 
            key="success"
          >
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
              {loadedUrls.slice(0, 3).map((url, index) => (
                <div key={index} style={{ 
                  padding: 6, 
                  background: '#f6ffed', 
                  borderRadius: 4, 
                  border: '1px solid #b7eb8f' 
                }}>
                  <Text style={{ fontSize: 10, color: '#389e0d', wordBreak: 'break-all' }}>
                    {url.length > 80 ? `${url.substring(0, 80)}...` : url}
                  </Text>
                </div>
              ))}
              {loadedUrls.length > 3 && (
                <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
                  ... 还有 {loadedUrls.length - 3} 个成功的图片
                </Text>
              )}
            </Space>
          </Panel>
        </Collapse>
      )}
    </Card>
  );
};

export default ImageLoadDebugPanel; 