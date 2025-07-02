import React, { useState, useEffect } from 'react';
import { Card, Button, Checkbox, message, Row, Col, Tag, Spin, Alert, Empty, Progress } from 'antd';
import { ArrowRightOutlined, EnvironmentOutlined, LoadingOutlined } from '@ant-design/icons';
import { useWorkflow } from '../WorkflowContext';
import { locationApi, LocationSummary, studyPlanApi, CreateStudyPlanRequest } from '../../services/apiService';
import LocationImageDisplay from '../LocationImageDisplay';

const LandmarksStep: React.FC = () => {
  const { nextStep, updateWorkflowData, workflowData } = useWorkflow();
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<LocationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  // 组件加载时获取景点数据
  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setIsLoading(true);
      
      // 从数据库获取景点列表，优先获取"都市客厅"相关景点
      const response = await locationApi.getUrbanLivingRoomLocations(0, 20);
      
      if (response.content && response.content.length > 0) {
        setLocations(response.content);
      } else {
        // 如果都市客厅景点不够，获取更多景点
        const allResponse = await locationApi.getLocations({ size: 20 });
        setLocations(allResponse.content);
      }
    } catch (error) {
      console.error('加载景点数据失败:', error);
      message.error('加载景点数据失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (location: LocationSummary, checked: boolean) => {
    if (checked) {
      setSelectedLocations([...selectedLocations, location]);
    } else {
      setSelectedLocations(selectedLocations.filter(l => l.id !== location.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedLocations.length === 0) {
      message.warning('请至少选择一个研学景点');
      return;
    }

    try {
      setIsSubmitting(true);
      setProgress(0);
      setStatusMessage('正在基于您选择的景点重新生成方案...');

      // 构建包含用户选择景点的请求
      const request: CreateStudyPlanRequest = {
        prompt: workflowData.teacherPrompt || '',
        preferredLocations: selectedLocations.map(loc => loc.nameZh),
        estimatedDurationMinutes: selectedLocations.length * 45, // 每个景点45分钟
        studentCount: 30, // 默认30人
      };

      setProgress(20);
      setStatusMessage('正在调用AI基于选择的景点生成个性化方案...');

      // 调用后端API重新创建研学方案
      const response = await studyPlanApi.createStudyPlan(request);
      
      setProgress(40);
      setStatusMessage('正在生成基于选择景点的课程方案...');

      // 更新工作流数据
      updateWorkflowData({
        selectedLocations: selectedLocations,
        studyPlanGenerationId: response.studyPlanGenerationId
      });

      setProgress(60);
      setStatusMessage('正在等待AI处理完成...');

      // 等待处理完成
      const finalResult = await studyPlanApi.waitForCompletion(response.studyPlanGenerationId);
      
      if (finalResult.status === 'failed') {
        throw new Error(finalResult.llmErrorMessage || '处理失败');
      }

      setProgress(100);
      setStatusMessage('基于选择景点的方案生成完成！');

      // 保存完整的方案数据
      updateWorkflowData({
        fullStudyPlan: finalResult
      });

      message.success(`已选择 ${selectedLocations.length} 个景点，AI已生成个性化课程方案！`);
      
      // 进入下一步
      setTimeout(() => {
        nextStep();
      }, 1000);
      
    } catch (error: any) {
      console.error('生成方案失败:', error);
      const errorMessage = error.message || '生成方案失败，请重试';
      message.error(errorMessage);
      setProgress(0);
      setStatusMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取景点标签
  const getLocationTags = (location: LocationSummary): string[] => {
    const tags: string[] = [];
    
    // 添加历史意义标签
    if (location.historicalSignificanceTags) {
      try {
        const historicalTags = typeof location.historicalSignificanceTags === 'string'
          ? JSON.parse(location.historicalSignificanceTags)
          : location.historicalSignificanceTags;
        if (Array.isArray(historicalTags)) {
          tags.push(...historicalTags.slice(0, 2));
        }
      } catch {}
    }
    
    // 添加艺术特色标签
    if (location.artisticFeaturesTags) {
      try {
        const artisticTags = typeof location.artisticFeaturesTags === 'string'
          ? JSON.parse(location.artisticFeaturesTags)
          : location.artisticFeaturesTags;
        if (Array.isArray(artisticTags)) {
          tags.push(...artisticTags.slice(0, 1));
        }
      } catch {}
    }
    
    return tags.slice(0, 3); // 最多显示3个标签
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <p style={{ marginTop: 16, color: '#666' }}>正在加载景点数据...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <Card 
        title="选择研学景点" 
        className="workflow-step-card"
        variant="outlined"
      >
        {isSubmitting && (
          <Card 
            style={{ marginBottom: 20, background: '#f6f8fa' }}
            variant="outlined"
          >
            <div style={{ textAlign: 'center' }}>
              <LoadingOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 16 }} />
              <h3>AI正在基于您选择的景点生成个性化方案</h3>
              <p style={{ color: '#666', marginBottom: 16 }}>{statusMessage}</p>
              <Progress 
                percent={progress} 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                style={{ maxWidth: 400, margin: '0 auto' }}
              />
            </div>
          </Card>
        )}

        <div style={{ marginBottom: 20 }}>
          <h4>根据您的教学要求：</h4>
          <div style={{ 
            background: '#f6f8fa', 
            padding: '12px 16px', 
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666',
            marginBottom: '16px',
            border: '1px solid #e1e8ed'
          }}>
            {workflowData.teacherPrompt || '请先完成教学要求输入'}
          </div>

          <Alert
            message="智能景点选择"
            description={`请从虹口区文化景点数据库中选择您希望包含在研学方案中的景点。AI将基于您的选择重新生成个性化的教学内容和活动安排。`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <p style={{ color: '#1890ff', fontWeight: 500 }}>
            📍 从虹口区文化景点数据库中选择适合的研学地点：
          </p>
        </div>

        {locations.length === 0 ? (
          <Empty 
            description="暂无可用景点数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {locations.map(location => {
              const isSelected = selectedLocations.some(l => l.id === location.id);
              const tags = getLocationTags(location);
              
              return (
                <Col xs={24} sm={12} lg={8} key={location.id}>
                  <Card 
                    size="small"
                    className={`landmark-card ${isSelected ? 'selected' : ''}`}
                    style={{ 
                      height: '100%',
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: isSelected 
                        ? '0 4px 16px rgba(24, 144, 255, 0.2)' 
                        : '0 2px 8px rgba(0, 0, 0, 0.06)',
                      opacity: isSubmitting ? 0.6 : 1
                    }}
                    onClick={() => !isSubmitting && handleLocationChange(location, !isSelected)}
                    cover={
                      <div style={{ position: 'relative' }}>
                        <LocationImageDisplay
                          imageUrls={location.imageUrls || []}
                          locationName={location.nameZh}
                          height={160}
                          showPreview={true}
                          showCarousel={true}
                          showBadge={true}
                          autoPlay={false}
                          showDebugInfo={process.env.NODE_ENV === 'development'}
                          className="landmark-image"
                        />
                        
                        {/* 选择状态覆盖层 */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(24, 144, 255, 0.1)',
                            borderRadius: '8px',
                            zIndex: 2
                          }} />
                        )}
                        
                        {/* 复选框 */}
                        <Checkbox 
                          checked={isSelected}
                          disabled={isSubmitting}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (!isSubmitting) {
                              handleLocationChange(location, e.target.checked);
                            }
                          }}
                          style={{ 
                            position: 'absolute', 
                            top: 12, 
                            right: 12, 
                            zIndex: 3,
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '4px',
                            padding: '2px'
                          }}
                        />
                      </div>
                    }
                  >
                    <div style={{ padding: '12px 16px' }}>
                      <h4 style={{ 
                        textAlign: 'center', 
                        margin: '0 0 12px 0',
                        fontSize: '16px',
                        fontWeight: 600,
                        lineHeight: '1.4',
                        color: isSelected ? '#1890ff' : '#333'
                      }}>
                        {location.nameZh}
                      </h4>
                      
                      {/* 地址信息 */}
                      {location.addressZh && (
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          margin: '0 0 12px 0',
                          lineHeight: '1.4',
                          textAlign: 'center',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          <EnvironmentOutlined style={{ marginRight: 4 }} />
                          {location.addressZh}
                        </p>
                      )}
                      
                      {/* 特色标签 */}
                      {tags.length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 4, 
                          justifyContent: 'center',
                          marginBottom: 8
                        }}>
                          {tags.map((tag, index) => (
                            <Tag 
                              key={index} 
                              color={isSelected ? 'blue' : 'default'}
                              style={{ 
                                margin: 0,
                                fontSize: '11px',
                                borderRadius: '8px'
                              }}
                            >
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      )}
                      
                      {/* 都市客厅标识 */}
                      {location.urbanLivingRoomRelevance === 'high' && (
                        <div style={{ textAlign: 'center' }}>
                          <Tag 
                            color="gold" 
                            style={{ 
                              margin: 0,
                              fontSize: '11px',
                              fontWeight: 500,
                              borderRadius: '8px'
                            }}
                          >
                            🏛️ 都市客厅
                          </Tag>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {selectedLocations.length > 0 && (
          <div style={{ 
            marginTop: 20, 
            padding: '16px', 
            background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)', 
            border: '1px solid #b7eb8f',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(82, 196, 26, 0.1)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#52c41a', fontWeight: 600 }}>
              ✅ 已选择 {selectedLocations.length} 个景点
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedLocations.map(location => (
                <Tag 
                  key={location.id}
                  color="green"
                  style={{ 
                    margin: 0,
                    borderRadius: '12px',
                    fontWeight: 500
                  }}
                >
                  {location.nameZh}
                </Tag>
              ))}
            </div>
            <p style={{ margin: '12px 0 0 0', color: '#666', fontSize: '14px' }}>
              💡 AI将基于您选择的景点重新生成个性化的教学内容和活动安排
            </p>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            loading={isSubmitting}
            onClick={handleSubmit}
            disabled={selectedLocations.length === 0}
            icon={!isSubmitting && <ArrowRightOutlined />}
            style={{
              borderRadius: '20px',
              padding: '0 30px',
              height: '45px',
              fontSize: '16px',
              fontWeight: 600,
              background: selectedLocations.length > 0 
                ? 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)'
                : undefined,
              border: 'none',
              boxShadow: selectedLocations.length > 0 
                ? '0 4px 15px rgba(24, 144, 255, 0.3)'
                : undefined
            }}
          >
            {isSubmitting ? '正在生成方案...' : `🚀 基于选择景点生成方案 (${selectedLocations.length}个)`}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LandmarksStep; 