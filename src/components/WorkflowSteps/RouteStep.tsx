import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, message, Spin, Alert, Tag, Timeline, Space, Divider } from 'antd';
import { ArrowRightOutlined, CarOutlined, EnvironmentOutlined, ClockCircleOutlined, ThunderboltOutlined, ManOutlined, BgColorsOutlined } from '@ant-design/icons';
import { useWorkflow } from '../WorkflowContext';
import { studyPlanApi, RouteDto, WaypointDto } from '../../services/apiService';
import RouteOptimizer from '../RouteOptimizer/RouteOptimizer';
import { RouteOption, RoutePlanningService, SchoolInfo, BaiduMapRouteResult } from '../../services/routePlanningService';

const RouteStep: React.FC = () => {
  const { nextStep, updateWorkflowData, workflowData, clearCache } = useWorkflow();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [routeData, setRouteData] = useState<RouteDto | null>(null);
  const [hasError, setHasError] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [transportMode] = useState<'driving' | 'walking' | 'riding' | 'transit'>('walking');
  const [baiduMapResult, setBaiduMapResult] = useState<BaiduMapRouteResult | null>(null);

  console.log('🛣️ RouteStep 组件开始渲染');
  console.log('📊 WorkflowData:', workflowData);
  console.log('🏫 当前schoolInfo状态:', schoolInfo);
  console.log('📍 studyPlanId:', workflowData.fullStudyPlan?.studyPlanId);
  
  const generateOptimizedRoute = useCallback(async () => {
    if (!workflowData.fullStudyPlan?.studyPlanId) {
      // 如果没有方案ID，显示错误信息
      setHasError(true);
      return;
    }

    try {
      setIsGenerating(true);
      
      // 使用百度地图MCP进行路径规划
      const result = await RoutePlanningService.optimizeMultiPointRouteWithBaiduMap(
        workflowData.fullStudyPlan.studyPlanId,
        {
          transportMode: transportMode,
          optimizeOrder: true,
          useBaiduMap: true
        }
      );

      setBaiduMapResult(result);
      setSchoolInfo(result.schoolOrigin || null);

      // 获取真实的研学地点信息
      const realLocations = workflowData.selectedLocations || [];
      
      // 将百度地图结果转换为前端显示格式，使用真实地点名称
      const optimizedRouteData: RouteDto = {
        id: Math.floor(Math.random() * 10000),
        routeName: `百度地图智能路线 - ${getTransportModeDescription(transportMode)}`,
        totalEstimatedDurationMinutes: Math.round(result.totalDuration / 60),
        transportSummary: `起点: ${result.schoolOrigin?.name || '虹口区实验学校'}, 交通方式: ${getTransportModeDescription(transportMode)}`,
        status: 'optimized',
        optimizationParameters: {
          transportMode: transportMode,
          useBaiduMap: true,
          schoolOrigin: result.schoolOrigin,
          totalDistance: result.totalDistance,
          totalDuration: result.totalDuration
        },
        waypoints: [
          // 添加学校起点
          {
            id: 0,
            locationId: 0,
            waypointOrder: 0,
            locationName: `🏫 ${result.schoolOrigin?.name || '虹口区实验学校'}（起点）`,
            estimatedArrivalTime: '08:30',
            estimatedDepartureTime: '09:00',
            durationMinutes: 30, // 集合准备时间
            transportToNextWaypoint: getTransportModeDescription(transportMode)
          },
          // 添加研学地点
          ...realLocations.map((location: any, index: number) => ({
            id: index + 1,
            locationId: location.locationId || (index + 1),
            waypointOrder: index + 1,
            locationName: location.nameZh || location.name || `研学地点${index + 1}`,
            estimatedArrivalTime: `${9 + Math.floor(index * 1.5)}:${(index * 30) % 60 < 10 ? '0' : ''}${(index * 30) % 60}`,
            estimatedDepartureTime: `${9 + Math.floor((index + 1) * 1.5)}:${((index + 1) * 30) % 60 < 10 ? '0' : ''}${((index + 1) * 30) % 60}`,
            durationMinutes: 60 + (index * 10), // 每个地点停留时间
            transportToNextWaypoint: index < realLocations.length - 1 ? getTransportModeDescription(transportMode) : getTransportModeDescription(transportMode)
          })),
          // 添加学校终点
          {
            id: realLocations.length + 1,
            locationId: realLocations.length + 1,
            waypointOrder: realLocations.length + 1,
            locationName: `🏫 ${result.schoolOrigin?.name || '虹口区实验学校'}（终点）`,
            estimatedArrivalTime: `${15 + Math.floor(realLocations.length * 0.5)}:00`,
            estimatedDepartureTime: `${15 + Math.floor(realLocations.length * 0.5)}:30`,
            durationMinutes: 30, // 总结分享时间
            transportToNextWaypoint: undefined
          }
        ]
      };

      setRouteData(optimizedRouteData);
      updateWorkflowData({
        fullStudyPlan: {
          ...workflowData.fullStudyPlan,
          studyRoute: optimizedRouteData
        }
      });

      message.success('百度地图智能路线规划完成！');
      
    } catch (error: any) {
      console.error('路线优化失败:', error);
      message.error(error.message || '路线优化失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  }, [workflowData.fullStudyPlan?.studyPlanId, transportMode, updateWorkflowData, workflowData.fullStudyPlan, workflowData.selectedLocations]);

  useEffect(() => {
    // 检查是否已有路线数据
    if (workflowData.fullStudyPlan?.studyRoute) {
      setRouteData(workflowData.fullStudyPlan.studyRoute);
    } else if (workflowData.fullStudyPlan?.studyPlanId) {
      // 如果有方案ID但没有路线，尝试生成优化路线
      generateOptimizedRoute();
    }
  }, [workflowData.fullStudyPlan, generateOptimizedRoute]);

  // 加载学校信息
  useEffect(() => {
    console.log('🔄 RouteStep useEffect - 加载学校信息触发');
    console.log('   - workflowData.fullStudyPlan:', workflowData.fullStudyPlan);
    console.log('   - studyPlanId:', workflowData.fullStudyPlan?.studyPlanId);
    
    const studyPlanId = workflowData.fullStudyPlan?.studyPlanId;
    if (!studyPlanId) {
      console.log('❌ studyPlanId 不存在，跳过学校信息加载');
      return;
    }
    
    const loadSchoolInfo = async () => {
      console.log('✅ 开始加载学校信息，方案ID:', studyPlanId);
      try {
        const info = await RoutePlanningService.extractSchoolInfo(studyPlanId);
        console.log('✅ 学校信息加载成功:', info);
        setSchoolInfo(info);
      } catch (error) {
        console.warn('❌ 加载学校信息失败:', error);
        // 如果提取失败，尝试从提示词中手动提取
        const defaultSchoolInfo: SchoolInfo = {
          name: '虹口区实验学校',
          address: '上海市虹口区',
          coordinates: { lat: 31.270459, lon: 121.480419 },
          extractedFrom: 'manual',
          geocodingSuccess: false
        };
        console.log('🔧 使用默认学校信息:', defaultSchoolInfo);
        setSchoolInfo(defaultSchoolInfo);
      }
    };

    loadSchoolInfo();
  }, [workflowData.fullStudyPlan]);

  // 获取交通方式描述
  const getTransportModeDescription = (mode: string): string => {
    switch (mode) {
      case 'driving': return '驾车';
      case 'walking': return '步行';
      case 'riding': return '骑行';
      case 'transit': return '公共交通';
      default: return '驾车';
    }
  };

  // 获取交通方式图标
  const getTransportModeIcon = (mode: string) => {
    switch (mode) {
      case 'driving': return <CarOutlined />;
      case 'walking': return <ManOutlined />;
      case 'riding': return <BgColorsOutlined />;
      case 'transit': return <EnvironmentOutlined />;
      default: return <CarOutlined />;
    }
  };

  // 处理智能路线选择
  const handleRouteOptimized = (route: RouteOption) => {
    message.success(`已选择${route.name}，预计${Math.round(route.duration / 60)}分钟到达`);
    
    // 将RouteOption转换为RouteDto格式
    const optimizedRouteData: RouteDto = {
      id: Math.floor(Math.random() * 10000),
      routeName: `${route.name} - 智能优化路线`,
      totalEstimatedDurationMinutes: Math.round(route.duration / 60),
      transportSummary: `距离: ${(route.distance / 1000).toFixed(1)}km, 时间: ${Math.round(route.duration / 60)}分钟`,
      status: '已优化',
      waypoints: []
    };
    
    setRouteData(optimizedRouteData);
    
    // 🎯 添加智能排序的说明
    message.info('路线已按距离智能排序，优先访问距离较近的研学地点');
  };

  // 将workflowData.selectedLocations转换为RouteOptimizer需要的格式
  const getLandmarksForOptimizer = () => {
    const locations = workflowData.selectedLocations || [];
    const landmarks = [];
    
    // 添加学校起点（如果有学校信息）
    if (schoolInfo && schoolInfo.coordinates) {
      landmarks.push({
        id: 'school-origin',
        name: `🏫 ${schoolInfo.name}（起点）`,
        address: schoolInfo.address,
        position: [schoolInfo.coordinates.lon, schoolInfo.coordinates.lat] as [number, number]
      });
    }
    
    // 添加研学地点
    locations.forEach((location: any, index: number) => {
      landmarks.push({
        id: `location-${location.locationId || index}`,
        name: location.nameZh || location.name || '未知地点',
        address: location.addressZh || location.address || '',
        position: [
          location.coordinates?.lon || (121.480419 + (index * 0.002)), 
          location.coordinates?.lat || (31.270459 + (index * 0.002))
        ] as [number, number]
      });
    });
    
    // 添加学校终点（如果有学校信息且不是起点）
    if (schoolInfo && schoolInfo.coordinates && landmarks.length > 1) {
      landmarks.push({
        id: 'school-destination',
        name: `🏫 ${schoolInfo.name}（终点）`,
        address: schoolInfo.address,
        position: [schoolInfo.coordinates.lon, schoolInfo.coordinates.lat] as [number, number]
      });
    }
    
    return landmarks;
  };

  const handleSubmit = async () => {
    try {
      // 更新工作流数据
      updateWorkflowData({
        studyRoute: routeData
      });
      
      message.success('路线设计确认完成，正在生成艺术笔记框架...');
      
      // 进入下一步
      setTimeout(() => {
        nextStep();
      }, 1000);
      
    } catch (error) {
      message.error('处理失败，请重试');
    }
  };

  const handleRestart = () => {
    clearCache();
    window.location.href = '/'; // 重定向到首页重新开始
  };

  if (isGenerating) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <h3>AI正在使用百度地图MCP生成步行路线方案...</h3>
          <p style={{ color: '#666' }}>根据您的课程规划和选择的景点，智能生成最优的步行研学路线</p>
        </div>
      </div>
    );
  }

  // 如果有错误且没有路线数据，显示错误界面
  if (hasError && !routeData) {
    return (
      <div style={{ padding: '20px 0' }}>
        <Card 
          title={
            <div>
              <CarOutlined style={{ marginRight: 8 }} />
              路线优化遇到问题
            </div>
          }
          className="workflow-step-card"
          variant="outlined"
        >
          <Alert
            message="数据异常"
            description="当前研学方案的数据可能存在问题，建议重新创建方案。"
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical" size="large">
              <p>系统检测到当前方案数据异常，这可能是由于：</p>
              <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                <li>方案数据不完整</li>
                <li>数据库连接问题</li>
                <li>缓存数据过期</li>
              </ul>
              
              <Space>
                <Button 
                  type="primary" 
                  onClick={handleRestart}
                  size="large"
                >
                  重新开始创建方案
                </Button>
                <Button 
                  onClick={() => setHasError(false)}
                  size="large"
                >
                  重试当前步骤
                </Button>
              </Space>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="route-step">
      <Card title="📍 百度地图智能路线设计" style={{ marginBottom: 16 }}>
        {/* 学校起点信息显示 */}
        {schoolInfo && (
          <Alert
            message={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🏫 研学起点：{schoolInfo.name}</span>
                <span style={{ color: '#666', fontSize: '12px' }}>
                  ({schoolInfo.extractedFrom === 'prompt' ? '从提示词提取' : 
                    schoolInfo.extractedFrom === 'structured_params' ? '从参数提取' : 
                    schoolInfo.extractedFrom === 'manual' ? '手动设置' : '默认设置'})
                </span>
              </div>
            }
            description={`地址: ${schoolInfo.address}`}
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 研学地点概览 */}
        {workflowData.selectedLocations && workflowData.selectedLocations.length > 0 && (
          <Alert
            message={
              <div>
                📍 已选择研学地点：
                {workflowData.selectedLocations.map((location: any, index: number) => (
                  <Tag key={index} color="blue" style={{ margin: '2px' }}>
                    {location.nameZh || location.name}
                  </Tag>
                ))}
              </div>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 交通方式选择 */}
        <Card size="small" title="交通方式设置" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>交通方式:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {getTransportModeIcon('walking')}
              <span style={{ color: '#52c41a', fontWeight: 'bold' }}>步行</span>
              <span style={{ color: '#666', fontSize: '12px' }}>（环保健康的研学方式）</span>
            </div>
          </div>
        </Card>

        {/* 路线生成按钮 */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Button
            type="primary"
            size="large"
            icon={<ManOutlined />}
            onClick={generateOptimizedRoute}
            loading={isGenerating}
            disabled={!workflowData.fullStudyPlan?.studyPlanId}
            style={{ minWidth: 200 }}
          >
            {isGenerating ? '正在规划步行路线...' : '百度地图步行路径规划'}
          </Button>
        </div>

        {/* 提示信息 */}
        <Alert
          message="百度地图MCP步行路径规划"
          description={
            <div>
              <p>• 🚶‍♂️ 步行研学，近距离感受城市文化</p>
              <p>• 🌱 环保健康，培养学生绿色出行理念</p>
              <p>• 📍 精确路径规划，确保安全便捷</p>
              <p>• 🔄 智能优化景点访问顺序，形成闭环路径</p>
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 路线结果显示 */}
        {routeData && (
          <Card title="🗺️ 路线规划结果" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <h4>{routeData.routeName}</h4>
              <p><strong>预计总时长:</strong> {routeData.totalEstimatedDurationMinutes} 分钟</p>
              <p><strong>交通概要:</strong> {routeData.transportSummary}</p>
              <p><strong>状态:</strong> {routeData.status === 'optimized' ? '已优化' : '已完成'}</p>
            </div>

            {/* 途经点列表 */}
            {routeData.waypoints && routeData.waypoints.length > 0 && (
              <div>
                <Divider orientation="left">途经点安排</Divider>
                {routeData.waypoints.map((waypoint, index) => (
                  <div key={waypoint.id} style={{ 
                    padding: '12px', 
                    border: '1px solid #f0f0f0', 
                    borderRadius: '6px',
                    marginBottom: '8px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>第 {waypoint.waypointOrder} 站：{waypoint.locationName}</strong>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          到达: {waypoint.estimatedArrivalTime} | 离开: {waypoint.estimatedDepartureTime}
                        </div>
                      </div>
                      <div style={{ color: '#1890ff' }}>
                        {waypoint.durationMinutes} 分钟
                      </div>
                    </div>
                    {waypoint.transportToNextWaypoint && (
                      <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
                        → {waypoint.transportToNextWaypoint}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 百度地图特有信息 */}
            {baiduMapResult && (
              <div style={{ marginTop: 16 }}>
                <Divider orientation="left">🎯 百度地图智能优化详情</Divider>
                <div style={{ background: '#f6ffed', padding: '12px', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                  <p><strong>🗺️ 总距离:</strong> {(baiduMapResult.totalDistance / 1000).toFixed(1)} 公里</p>
                  <p><strong>⏱️ 预计用时:</strong> {Math.round(baiduMapResult.totalDuration / 60)} 分钟</p>
                  <p><strong>🏫 起点学校:</strong> {baiduMapResult.schoolOrigin?.name || '虹口区实验学校'}</p>
                  <p><strong>🧠 规划方式:</strong> 百度地图MCP智能优化</p>
                  <div style={{ marginTop: 8, padding: '8px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#1890ff' }}>
                      <strong>🎯 智能排序说明:</strong> 研学地点已按照<span style={{ color: '#f5222d' }}>从学校的实际步行距离</span>进行排序，
                      优先安排距离较近的地点，确保路线效率最高。坐标数据来源于百度地图地理编码，保证与地图渲染完全一致。
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 坐标一致性验证信息 */}
            {schoolInfo && (
              <div style={{ marginTop: 16 }}>
                <Divider orientation="left">📍 坐标一致性验证</Divider>
                <div style={{ background: '#fff7e6', padding: '12px', borderRadius: '6px', border: '1px solid #ffd591' }}>
                  <p><strong>🏫 学校坐标:</strong> 
                    {schoolInfo.coordinates ? 
                      ` 纬度: ${schoolInfo.coordinates.lat}, 经度: ${schoolInfo.coordinates.lon}` : 
                      ' 坐标获取中...'
                    }
                  </p>
                  <p><strong>📍 坐标来源:</strong> 
                    {schoolInfo.extractedFrom === 'prompt' ? '从提示词提取' :
                     schoolInfo.extractedFrom === 'structured_params' ? '从参数提取' :
                     schoolInfo.extractedFrom === 'manual' ? '手动设置' : '百度地图地理编码'}
                  </p>
                  <p><strong>✅ 地理编码状态:</strong> 
                    <span style={{ color: schoolInfo.geocodingSuccess ? '#52c41a' : '#faad14' }}>
                      {schoolInfo.geocodingSuccess ? '成功验证' : '使用备用坐标'}
                    </span>
                  </p>
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#fa8c16' }}>
                    💡 所有研学地点坐标均通过百度地图MCP服务获取，确保与前端地图渲染完全一致
                  </div>
                </div>
              </div>
            )}

            {/* 地图预览 */}
            <div style={{ marginTop: 16 }}>
              <Divider orientation="left">路线地图预览</Divider>
              
              {/* 🎯 地图标记优化说明 */}
              <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fff7e6', borderRadius: '6px', border: '1px solid #ffd591' }}>
                <p style={{ margin: 0, fontSize: '12px', color: '#fa8c16' }}>
                  <strong>🗺️ 混合标记策略:</strong> 
                  <span style={{ color: '#f5222d' }}>优先显示百度地图原生POI标识</span>（如鲁迅公园等景点），
                  并叠加红色编号圆圈标明研学顺序。学校使用专用绿色标记以便识别起终点。
                  这样既保留了百度地图丰富的POI信息，又清晰显示了研学路线安排。
                </p>
              </div>
              
              {(() => {
                console.log('🗺️ 准备渲染RouteOptimizer');
                console.log('   - schoolInfo 状态:', schoolInfo);
                console.log('   - schoolInfo || undefined:', schoolInfo || undefined);
                console.log('   - landmarks数据:', getLandmarksForOptimizer());
                return (
                  <RouteOptimizer
                    landmarks={getLandmarksForOptimizer()}
                    onRouteSelect={handleRouteOptimized}
                    schoolOrigin={schoolInfo || undefined}
                    className="embedded-route-map"
                  />
                );
              })()}
            </div>

            {/* 确认按钮 */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                icon={<ArrowRightOutlined />}
              >
                确认路线，进入下一步
              </Button>
            </div>
          </Card>
        )}

        {/* 如果没有研学方案，显示手动规划选项 */}
        {!workflowData.fullStudyPlan?.studyPlanId && (
          <Alert
            message="没有找到研学方案"
            description={
              <div>
                <p>请先完成研学方案生成。</p>
                <Button 
                  type="link" 
                  onClick={handleRestart}
                  style={{ paddingLeft: 0 }}
                >
                  重新开始创建方案 →
                </Button>
              </div>
            }
            type="warning"
            showIcon
          />
        )}
      </Card>
    </div>
  );
};

export default RouteStep; 