import React, { useState, useCallback, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Radio, 
  Space, 
  Spin, 
  Alert, 
  Tag, 
  Divider, 
  Timeline,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Tabs,
  Select,
  Typography
} from 'antd';
import { 
  CarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined, 
  ReloadOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import { 
  RoutePlanningService, 
  RouteOption, 
  Coordinates,
  TransportMode,
  SchoolInfo
} from '../../services/routePlanningService';
import RouteMap from '../RouteMap/RouteMap';
import { Route, Landmark } from '../RouteMap/types';
import './RouteOptimizer.css';

const { Option } = Select;
const { Text } = Typography;

interface LandmarkData {
  id: string;
  name: string;
  address: string;
  position: [number, number];
  duration?: string;
}

interface RouteOptimizerProps {
  landmarks: LandmarkData[];
  onRouteSelect: (route: RouteOption) => void;
  className?: string;
  schoolOrigin?: SchoolInfo;
}

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({
  landmarks,
  onRouteSelect,
  className = '',
  schoolOrigin
}) => {
  const [loading, setLoading] = useState(false);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedLandmark, setSelectedLandmark] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [optimizationMode, setOptimizationMode] = useState<'speed' | 'distance' | 'scenic'>('speed');
  const [mapRoute, setMapRoute] = useState<Route | null>(null);

  // 将landmarks转换为地图格式
  const convertToMapRoute = useCallback((routeData?: RouteOption): Route => {
    const mapLandmarks: Landmark[] = landmarks.map((landmark, index) => ({
      id: landmark.id,
      name: landmark.name,
      address: landmark.address,
      position: landmark.position,
      duration: landmark.duration || '60分钟',
      order: index + 1
    }));

    return {
      id: routeData?.id || 'default-route',
      name: routeData ? `${getModeName(routeData.mode)}路线` : '默认路线',
      landmarks: mapLandmarks,
      path: routeData?.polyline || landmarks.map(l => l.position),
      transportMode: routeData?.mode || 'walking',
      totalDistance: routeData?.distance || 0,
      totalDuration: routeData?.duration || 0
    };
  }, [landmarks]);

  // 初始化地图路线
  useEffect(() => {
    if (landmarks.length > 0) {
      const defaultRoute = convertToMapRoute();
      setMapRoute(defaultRoute);
    }
  }, [landmarks, convertToMapRoute]);

  // 获取交通方式中文名称
  const getModeName = (mode: TransportMode): string => {
    switch (mode) {
      case 'walking': return '步行';
      case 'driving': return '驾车';
      case 'transit': return '公交';
      case 'riding': return '骑行';
      default: return '步行';
    }
  };

  // 开始路线规划
  const handleOptimizeRoutes = useCallback(async () => {
    if (landmarks.length < 2) {
      setError('至少需要选择2个景点才能进行路线规划');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // 模拟调用后端API进行路线优化
      const mockRoutes: RouteOption[] = [
        {
          id: 'walking-route',
          name: '步行路线',
          mode: 'walking' as TransportMode,
          distance: 2500,
          duration: 1800, // 30分钟
          polyline: landmarks.map(l => l.position),
          description: '推荐步行路线，适合慢节奏游览',
          legs: [],
          recommendedFor: ['近距离游览', '健康出行', '观景体验'],
          instructions: [
            '从起点出发',
            ...landmarks.slice(1).map((landmark, index) => `步行至${landmark.name}`)
          ],
          schoolOrigin: schoolOrigin,
          totalDurationMinutes: 30,
          totalDistanceKilometers: 2.5,
          transportMode: 'walking' as TransportMode,
          carbonFootprint: 0,
          cost: 0,
          waypoints: [],
          routeSegments: [],
          pros: ['环保', '健康', '可随时停留'],
          cons: ['耗时较长', '天气影响大']
        },
        {
          id: 'transit-route',
          name: '公交路线',
          mode: 'transit' as TransportMode,
          distance: 3200,
          duration: 2400, // 40分钟
          polyline: landmarks.map(l => l.position),
          description: '公共交通路线，省时省力',
          legs: [],
          recommendedFor: ['环保出行', '经济实惠', '避免拥堵'],
          instructions: [
            '从起点出发',
            ...landmarks.slice(1).map((landmark, index) => `乘坐公交至${landmark.name}`)
          ],
          schoolOrigin: schoolOrigin,
          totalDurationMinutes: 40,
          totalDistanceKilometers: 3.2,
          transportMode: 'transit' as TransportMode,
          carbonFootprint: 0.16, // 3.2km * 0.05kg/km
          cost: 10,
          waypoints: [],
          routeSegments: [],
          pros: ['经济实惠', '环保', '避免停车难题'],
          cons: ['班次限制', '换乘可能较多']
        }
      ];

      // 根据优化模式排序路线
      const sortedRoutes = sortRoutesByMode(mockRoutes, optimizationMode);
      setRouteOptions(sortedRoutes);
      
      if (sortedRoutes.length > 0) {
        setSelectedRouteId(sortedRoutes[0].id);
        onRouteSelect(sortedRoutes[0]);
        
        // 更新地图显示
        const selectedMapRoute = convertToMapRoute(sortedRoutes[0]);
        setMapRoute(selectedMapRoute);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '路线规划失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [landmarks, optimizationMode, onRouteSelect, convertToMapRoute, schoolOrigin]);

  // 根据优化模式排序路线
  const sortRoutesByMode = (routes: RouteOption[], mode: string): RouteOption[] => {
    return [...routes].sort((a, b) => {
      switch (mode) {
        case 'speed':
          return a.duration - b.duration;
        case 'distance':
          return a.distance - b.distance;
        case 'scenic':
          // 优先推荐步行路线，其次是骑行
          const getModeScore = (routeMode: TransportMode) => {
            switch (routeMode) {
              case 'walking': return 1;
              case 'riding': return 2;
              case 'transit': return 3;
              case 'driving': return 4;
              default: return 5;
            }
          };
          return getModeScore(a.mode) - getModeScore(b.mode);
        default:
          return 0;
      }
    });
  };

  // 处理路线选择
  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    const selectedRoute = routeOptions.find(route => route.id === routeId);
    if (selectedRoute) {
      onRouteSelect(selectedRoute);
      
      // 更新地图显示
      const selectedMapRoute = convertToMapRoute(selectedRoute);
      setMapRoute(selectedMapRoute);
    }
  };

  // 处理地图上景点选择
  const handleLandmarkSelect = (landmarkId: string) => {
    setSelectedLandmark(landmarkId);
  };

  // 获取交通方式图标
  const getModeIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'driving':
        return <CarOutlined />;
      case 'walking':
        return <EnvironmentOutlined />;
      case 'transit':
        return <TeamOutlined />;
      case 'riding':
        return <BgColorsOutlined />;
      default:
        return <EnvironmentOutlined />;
    }
  };

  // 获取交通方式颜色
  const getModeColor = (mode: TransportMode) => {
    switch (mode) {
      case 'driving':
        return 'blue';
      case 'walking':
        return 'green';
      case 'transit':
        return 'orange';
      case 'riding':
        return 'purple';
      default:
        return 'default';
    }
  };

  // 安全地获取交通方式图标（处理string类型）
  const getSafeModeIcon = (mode: string): React.ReactNode => {
    if (mode === 'walking' || mode === 'driving' || mode === 'transit' || mode === 'riding') {
      return getModeIcon(mode as TransportMode);
    }
    return <EnvironmentOutlined />;
  };

  // 安全地获取交通方式颜色（处理string类型）
  const getSafeModeColor = (mode: string): string => {
    if (mode === 'walking' || mode === 'driving' || mode === 'transit' || mode === 'riding') {
      return getModeColor(mode as TransportMode);
    }
    return 'default';
  };

  // 获取路线推荐度
  const getRouteScore = (route: RouteOption) => {
    // 基于时间、距离和推荐场景计算得分
    const timeScore = route.duration < 1800 ? 5 : route.duration < 3600 ? 3 : 1; // 30分钟以内最高分
    const distanceScore = route.distance < 2000 ? 5 : route.distance < 5000 ? 3 : 1; // 2公里以内最高分
    const modeScore = route.mode === 'walking' ? 5 : route.mode === 'transit' ? 4 : 3;
    
    return Math.round((timeScore + distanceScore + modeScore) / 3);
  };

  // 转换学校信息为地图格式
  const getSchoolForMap = () => {
    if (schoolOrigin && schoolOrigin.coordinates) {
      return {
        name: schoolOrigin.name,
        address: schoolOrigin.address,
        position: [schoolOrigin.coordinates.lon, schoolOrigin.coordinates.lat] as [number, number]
      };
    }
    return undefined;
  };

  return (
    <div className={`route-optimizer ${className}`}>
      {/* 学校起点信息 */}
      {schoolOrigin && (
        <Alert
          message={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🏫 研学起点：{schoolOrigin.name}</span>
            </div>
          }
          description={`地址: ${schoolOrigin.address}`}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 优化模式选择 */}
      <Card size="small" title="路线优化设置" style={{ marginBottom: 16 }}>
        <Space>
          <Text>优化目标:</Text>
          <Select
            value={optimizationMode}
            onChange={(value) => setOptimizationMode(value)}
            style={{ width: 120 }}
          >
            <Option value="speed">最快路线</Option>
            <Option value="distance">最短距离</Option>
            <Option value="scenic">风景路线</Option>
          </Select>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={handleOptimizeRoutes}
            loading={loading}
            disabled={landmarks.length < 2}
          >
            智能规划
          </Button>
        </Space>
      </Card>

      {/* 错误信息 */}
      {error && (
        <Alert
          message="路线规划失败"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError('')}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 路线选项 */}
      {routeOptions.length > 0 && (
        <Card title="路线方案" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            {routeOptions.map((route) => (
              <Card
                key={route.id}
                size="small"
                style={{
                  cursor: 'pointer',
                  border: selectedRouteId === route.id ? '2px solid #1890ff' : '1px solid #d9d9d9'
                }}
                onClick={() => handleRouteSelect(route.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {getModeIcon(route.mode)}
                      <Text strong>{route.name}</Text>
                      {selectedRouteId === route.id && (
                        <Tag color="blue">已选择</Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {route.description}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      {Math.round(route.duration / 60)}分钟
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {(route.distance / 1000).toFixed(1)}公里
                    </div>
                  </div>
                </div>
                
                {/* 推荐场景 */}
                <div style={{ marginTop: 8 }}>
                  {route.recommendedFor.map((scenario: string, index: number) => (
                    <Tag key={index} style={{ marginBottom: 4 }}>
                      {scenario}
                    </Tag>
                  ))}
                </div>
              </Card>
            ))}
          </Space>
        </Card>
      )}

      {/* 地图显示 */}
      {mapRoute && (
        <Card title="路线预览" style={{ marginBottom: 16 }}>
          <RouteMap
            route={mapRoute}
            selectedLandmark={selectedLandmark}
            onLandmarkSelect={handleLandmarkSelect}
            schoolOrigin={getSchoolForMap()}
          />
        </Card>
      )}

      {/* 景点不足提示 */}
      {landmarks.length < 2 && (
        <Alert
          message="景点数量不足"
          description="至少需要选择2个景点才能进行路线规划。请返回上一步添加更多景点。"
          type="warning"
          showIcon
        />
      )}
    </div>
  );
};

export default RouteOptimizer; 