import React, { useState, useEffect } from 'react';
import { Typography, Card, Row, Col, Button, Tag, List, Tooltip, message, Space, Divider, Spin, Alert } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined, WalletOutlined, CarOutlined, InfoCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import RouteMap from '../components/RouteMap/RouteMap';
import RouteOptimizer from '../components/RouteOptimizer/RouteOptimizer';
import { Route as RouteType, Landmark } from '../components/RouteMap/types';
import { RouteOption } from '../services/routePlanningService';
import { studyPlanService } from '../services/studyPlanService';
import { API_CONFIG } from '../config/config';

const { Title, Paragraph, Text } = Typography;

interface StudyLocation {
  id: number;
  nameZh: string;
  addressZh: string;
  coordinates?: string | { lat: number; lon: number } | { lat: number; lng: number } | { latitude: number; longitude: number };
  descriptionZh?: string;
}

interface CoursePlanItem {
  id: number;
  activityDescription: string;
  estimatedDurationMinutes: number;
  studyLocation: StudyLocation;
  teachingContentSummary?: string;
  urbanLivingRoomFocus?: string;
}

interface RouteWaypoint {
  id: number;
  waypointOrder: number;
  coursePlanItem: CoursePlanItem;
  transportToNextWaypointMode?: string;
  transportToNextWaypointDetails?: string;
  transportToNextWaypointDurationMinutes?: number;
  estimatedArrivalTime?: string;
  estimatedDepartureTime?: string;
}

interface StudyRoute {
  id: number;
  routeName: string;
  totalEstimatedDurationMinutes: number;
  transportSummary?: string;
  status: string;
  waypoints: RouteWaypoint[];
}

interface StudyPlan {
  id: number;
  planName: string;
  themeZh: string;
  targetAudienceDescription: string;
  overallLearningObjectives: string;
  estimatedDurationDescription: string;
  budgetDescription: string;
  status: string;
  items: CoursePlanItem[];
  routes: StudyRoute[];
}

const RoutePlansPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  console.log('🚀 RoutePlansPage 组件开始加载');
  console.log('📍 URL参数 id:', id);
  
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<StudyRoute | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<{
    name: string;
    address: string;
    coordinates: { lat: number; lon: number };
    extractedFrom?: string;
    geocodingSuccess?: boolean;
  } | null>(null);

  console.log('📊 组件状态初始化完成');
  console.log('   - studyPlan:', studyPlan);
  console.log('   - loading:', loading);
  console.log('   - schoolInfo:', schoolInfo);

  useEffect(() => {
    console.log('🔄 useEffect 触发 - fetchStudyPlan');
    console.log('   - id:', id);
    
    if (id) {
      console.log('✅ ID存在，开始获取研学方案');
      fetchStudyPlan(parseInt(id));
    } else {
      console.log('❌ ID不存在');
    }
  }, [id]);

  const fetchStudyPlan = async (planId: number) => {
    try {
      setLoading(true);
      setError(null);
      const plan = await studyPlanService.getStudyPlan(planId);
      setStudyPlan(plan);
        
      // 设置默认激活的路线
      if (plan.routes && plan.routes.length > 0) {
        setActiveRoute(plan.routes[0]);
      }

      // 获取学校信息
      try {
        console.log('=== 开始获取学校信息 ===');
        console.log('方案ID:', planId);
        const apiUrl = `${API_CONFIG.BASE_URL}/api/v1/study-plans/${planId}/extract-school-info`;
        console.log('请求URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('学校信息API响应状态:', response.status);
        console.log('响应是否成功:', response.ok);

        if (response.ok) {
          const schoolData = await response.json();
          console.log('学校信息API原始响应:', schoolData);
          console.log('响应数据类型:', typeof schoolData);
          console.log('coordinates字段:', schoolData.coordinates);
          console.log('coordinates类型:', typeof schoolData.coordinates);
          
          const processedSchoolInfo = {
            name: schoolData.name,
            address: schoolData.address,
            coordinates: schoolData.coordinates,
            extractedFrom: schoolData.extracted_from,
            geocodingSuccess: schoolData.geocoding_success
          };
          
          console.log('处理后的学校信息:', processedSchoolInfo);
          setSchoolInfo(processedSchoolInfo);
          console.log('学校信息已设置到state');
        } else {
          const errorText = await response.text();
          console.error('获取学校信息失败，HTTP状态:', response.status);
          console.error('错误响应内容:', errorText);
          console.warn('获取学校信息失败，使用默认值');
          setSchoolInfo({
            name: '虹口区实验学校',
            address: '上海市虹口区',
            coordinates: { lat: 31.270459, lon: 121.480419 },
            extractedFrom: 'default',
            geocodingSuccess: false
          });
        }
      } catch (schoolErr) {
        console.error('获取学校信息异常:', schoolErr);
        if (schoolErr instanceof Error) {
          console.error('异常详情:', schoolErr.message, schoolErr.stack);
        }
        setSchoolInfo({
          name: '虹口区实验学校',
          address: '上海市虹口区',
          coordinates: { lat: 31.270459, lon: 121.480419 },
          extractedFrom: 'default',
          geocodingSuccess: false
        });
      }
    } catch (err) {
      console.error('获取研学方案失败:', err);
      setError('获取研学方案失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeRoute = async () => {
    if (!studyPlan) return;

    try {
      setOptimizing(true);
      await studyPlanService.generateOptimizedRoute(studyPlan.id);
      // 重新获取更新后的数据
      await fetchStudyPlan(studyPlan.id);
    } catch (err) {
      console.error('路线优化失败:', err);
      setError('路线优化失败，请稍后重试');
    } finally {
      setOptimizing(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  };

  const getTransportModeTag = (mode?: string) => {
    const modeMap: { [key: string]: { color: string; text: string } } = {
      'walking': { color: 'green', text: '步行' },
      'driving': { color: 'blue', text: '驾车' },
      'public_transit': { color: 'orange', text: '公共交通' },
      'riding': { color: 'purple', text: '骑行' },
      '步行': { color: 'green', text: '步行' },
      '驾车': { color: 'blue', text: '驾车' },
      '公共交通': { color: 'orange', text: '公共交通' },
      '骑行': { color: 'purple', text: '骑行' }
  };

    const modeInfo = mode ? modeMap[mode] || { color: 'default', text: mode } : { color: 'default', text: '未知' };
    return <Tag color={modeInfo.color}>{modeInfo.text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="加载失败"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
        action={
          <Button size="small" onClick={() => window.location.reload()}>
            重试
          </Button>
        }
      />
    );
  }

  if (!studyPlan) {
    return (
      <Alert
        message="未找到研学方案"
        description="请检查方案ID是否正确"
        type="warning"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 头部信息 */}
        <Card style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <Title level={2} style={{ margin: 0, marginBottom: 8 }}>
                {studyPlan.planName}
              </Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                {studyPlan.themeZh}
              </Text>
              <div style={{ marginTop: 16 }}>
                <Space size="large">
                  <div>
                    <Text strong>目标群体：</Text>
                    <Text>{studyPlan.targetAudienceDescription}</Text>
                  </div>
                  <div>
                    <Text strong>预计时长：</Text>
                    <Text>{studyPlan.estimatedDurationDescription}</Text>
                  </div>
                  <div>
                    <Text strong>预算：</Text>
                    <Text>{studyPlan.budgetDescription}</Text>
                  </div>
                </Space>
              </div>
            </div>
            <Space>
                    <Button 
                      type="primary" 
                onClick={handleOptimizeRoute}
                loading={optimizing}
                icon={<CarOutlined />}
                    >
                {optimizing ? '优化中...' : '路线优化'}
              </Button>
              <Button onClick={() => navigate('/study-plans')}>
                返回列表
                    </Button>
            </Space>
                  </div>
                </Card>

        <Row gutter={24}>
          {/* 左侧：路线详情 */}
          <Col xs={24} lg={14}>
            {activeRoute && (
              <Card 
                title={
                  <Space>
                    <EnvironmentOutlined />
                    {activeRoute.routeName || '研学路线'}
                    <Tag color="blue">
                      {formatDuration(activeRoute.totalEstimatedDurationMinutes)}
                    </Tag>
                  </Space>
                }
                style={{ marginBottom: 24 }}
              >
                {activeRoute.transportSummary && (
                  <Alert
                    message="交通概要"
                    description={activeRoute.transportSummary}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                  <List
                  dataSource={activeRoute.waypoints?.sort((a, b) => a.waypointOrder - b.waypointOrder) || []}
                  renderItem={(waypoint, index) => (
                    <List.Item style={{ padding: '16px 0' }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div 
                            style={{ 
                              width: 24, 
                              height: 24, 
                              borderRadius: '50%', 
                              backgroundColor: '#1890ff', 
                              color: 'white', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: 12, 
                              fontWeight: 'bold',
                              marginRight: 12,
                              flexShrink: 0
                            }}
                          >
                            {index + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <Title level={4} style={{ margin: 0, marginBottom: 4 }}>
                              {waypoint.coursePlanItem?.studyLocation?.nameZh}
                            </Title>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                              <EnvironmentOutlined style={{ marginRight: 4 }} />
                              {waypoint.coursePlanItem?.studyLocation?.addressZh}
                            </Text>
                            
                            {waypoint.coursePlanItem?.activityDescription && (
                              <Paragraph style={{ marginBottom: 8 }}>
                                <Text strong>活动内容：</Text>
                                {waypoint.coursePlanItem.activityDescription}
                              </Paragraph>
                            )}

                            <Space>
                              <Tag icon={<ClockCircleOutlined />} color="blue">
                                {formatDuration(waypoint.coursePlanItem?.estimatedDurationMinutes || 0)}
                              </Tag>
                              {waypoint.transportToNextWaypointMode && (
                                <>
                                  <Text type="secondary">下一站：</Text>
                                  {getTransportModeTag(waypoint.transportToNextWaypointMode)}
                                  {waypoint.transportToNextWaypointDurationMinutes && (
                                    <Text type="secondary">
                                      ({formatDuration(waypoint.transportToNextWaypointDurationMinutes)})
                                    </Text>
                                  )}
                                </>
                              )}
                            </Space>

                            {waypoint.transportToNextWaypointDetails && (
                              <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {waypoint.transportToNextWaypointDetails}
                                </Text>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      </List.Item>
                    )}
                  />
                </Card>
            )}
              </Col>
              
          {/* 右侧：地图预览 */}
          <Col xs={24} lg={10}>
            <Card title="路线地图" style={{ marginBottom: 24 }}>
              {activeRoute?.waypoints && activeRoute.waypoints.length > 0 ? (
                  (() => {
                    console.log('=== 准备渲染RouteMap ===');
                    console.log('activeRoute.waypoints:', activeRoute.waypoints);
                    console.log('schoolInfo状态:', schoolInfo);
                    console.log('schoolInfo类型:', typeof schoolInfo);
                    console.log('schoolInfo是否为null:', schoolInfo === null);
                    console.log('=== RouteMap渲染准备完成 ===');
                    return (
                      <RouteMap 
                        waypoints={activeRoute.waypoints}
                        height="500px"
                        schoolInfo={schoolInfo ?? undefined}
                      />
                    );
                  })()
              ) : (
                (() => {
                  console.log('=== 无waypoints，但仍渲染RouteMap显示学校 ===');
                  console.log('schoolInfo状态:', schoolInfo);
                  return (
                    <RouteMap 
                      waypoints={[]}
                      height="500px"
                      schoolInfo={schoolInfo ?? undefined}
                    />
                  );
                })()
              )}
                </Card>
              </Col>
            </Row>

        {/* 学习目标 */}
        <Card title="学习目标" style={{ marginBottom: 24 }}>
          <Paragraph>{studyPlan.overallLearningObjectives}</Paragraph>
        </Card>
      </div>
    </div>
  );
};

export default RoutePlansPage; 
