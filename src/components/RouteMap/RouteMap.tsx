import React, { useEffect, useState, useRef } from 'react';
import { Spin, message } from 'antd';
import { MAP_CONFIG, ROUTE_COLORS } from './config';
import { Route } from './types';

// 支持原有的Route+Landmark格式
interface RouteLandmarkProps {
  route: Route;
  selectedLandmark: string | null;
  onLandmarkSelect: (landmarkId: string) => void;
  schoolOrigin?: {
    name: string;
    address: string;
    position: [number, number];
  };
}

// 支持新的waypoints格式
interface WaypointsProps {
  waypoints: Array<{
    id: number;
    waypointOrder: number;
    coursePlanItem: {
      studyLocation: {
        nameZh: string;
        addressZh: string;
        coordinates?: string | { lat: number; lon: number } | { lat: number; lng: number } | { latitude: number; longitude: number };
      };
    };
    transportToNextWaypointMode?: string;
    transportToNextWaypointDetails?: string;
  }>;
  height?: string;
  schoolInfo?: {
    name: string;
    address: string;
    coordinates: { lat: number; lon: number } | { lat: number; lng: number } | { latitude: number; longitude: number };
    extractedFrom?: string;
    geocodingSuccess?: boolean;
  };
  // 空的回调函数，保持接口一致
  selectedLandmark?: null;
  onLandmarkSelect?: () => void;
}

type RouteMapProps = RouteLandmarkProps | WaypointsProps;

// 类型守卫函数
const isWaypointsFormat = (props: RouteMapProps): props is WaypointsProps => {
  return 'waypoints' in props;
};

const RouteMap: React.FC<RouteMapProps> = (props) => {
  console.log('🗺️ RouteMap 统一组件开始渲染');
  console.log('📍 Props类型:', isWaypointsFormat(props) ? 'waypoints格式' : 'route+landmark格式');
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 存储地图实例和覆盖物的引用
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const schoolMarkerRef = useRef<any>(null);

  // 创建安全的base64编码函数，可以处理中文字符
  const safeBase64Encode = (str: string): string => {
    try {
      // 先进行UTF-8编码，再进行base64编码
      return btoa(unescape(encodeURIComponent(str)));
    } catch (error) {
      console.error('Base64编码失败:', error);
      // 如果还是失败，使用简单的替换方案
      return btoa(str.replace(/[\u00A0-\u9999]/g, '?'));
    }
  };

  // 解析坐标的通用函数
  const parseCoordinates = (coordinates: any): { lat: number; lng: number } | null => {
    try {
      if (typeof coordinates === 'string') {
        const coords = coordinates.split(',');
        if (coords.length === 2) {
          const lat = parseFloat(coords[0].trim());
          const lng = parseFloat(coords[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
          }
        }
      } else if (typeof coordinates === 'object' && coordinates !== null) {
        let lat: number, lng: number;
        
        if ('lat' in coordinates && 'lon' in coordinates) {
          lat = Number(coordinates.lat);
          lng = Number(coordinates.lon);
        } else if ('lat' in coordinates && 'lng' in coordinates) {
          lat = Number(coordinates.lat);
          lng = Number(coordinates.lng);
        } else if ('latitude' in coordinates && 'longitude' in coordinates) {
          lat = Number(coordinates.latitude);
          lng = Number(coordinates.longitude);
        } else {
          return null;
        }
        
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    } catch (e) {
      console.warn('坐标解析失败:', coordinates, e);
    }
    return null;
  };

  // 初始化地图
  useEffect(() => {
    const loadBMapScript = () => {
      console.log('正在加载百度地图脚本...');
      const script = document.createElement('script');
      script.src = `//api.map.baidu.com/api?type=webgl&v=1.0&ak=${MAP_CONFIG.key}`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    };

    const initMap = () => {
      console.log('初始化百度地图...');
      if (!mapContainerRef.current) {
        console.error('地图容器不存在');
        setLoading(false);
        setError('地图容器不存在');
        return;
      }
      
      try {
        const BMapGL = (window as any).BMapGL;
        if (!BMapGL) {
          message.error('百度地图加载失败');
          setLoading(false);
          setError('百度地图加载失败');
          return;
        }

        const map = new BMapGL.Map(mapContainerRef.current);
        
        // 🎯 使用配置文件中的显示选项，避免与自定义标记重复
        map.setDisplayOptions(MAP_CONFIG.displayOptions);
        
        // 设置地图中心点和缩放级别
        let center;
        if (isWaypointsFormat(props) && props.schoolInfo?.coordinates) {
          const schoolCoords = parseCoordinates(props.schoolInfo.coordinates);
          if (schoolCoords) {
            center = new BMapGL.Point(schoolCoords.lng, schoolCoords.lat);
          }
        } else if (!isWaypointsFormat(props) && props.schoolOrigin) {
          center = new BMapGL.Point(props.schoolOrigin.position[0], props.schoolOrigin.position[1]);
        }
        
        if (!center) {
          center = new BMapGL.Point(MAP_CONFIG.defaultCenter[0], MAP_CONFIG.defaultCenter[1]);
        }
        
        map.centerAndZoom(center, MAP_CONFIG.defaultZoom);
        map.enableScrollWheelZoom(true);
        
        // 添加控件
        map.addControl(new BMapGL.ScaleControl());
        map.addControl(new BMapGL.ZoomControl());

        mapRef.current = map;
        setInitialized(true);
        setLoading(false);
        console.log('百度地图初始化成功');
      } catch (error) {
        console.error('地图初始化失败:', error);
        message.error('地图初始化失败');
        setLoading(false);
        setError('地图初始化失败');
      }
    };

    if (!(window as any).BMapGL) {
      loadBMapScript();
    } else {
      initMap();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, [props]);

  // 更新地图标记和路线
  useEffect(() => {
    if (!initialized || !mapRef.current) return;

    const BMapGL = (window as any).BMapGL;
    const map = mapRef.current;

    // 清除之前的标记和路线
    markersRef.current.forEach(marker => {
      map.removeOverlay(marker);
    });
    markersRef.current = [];

    if (polylineRef.current) {
      map.removeOverlay(polylineRef.current);
      polylineRef.current = null;
    }

    if (schoolMarkerRef.current) {
      map.removeOverlay(schoolMarkerRef.current);
      schoolMarkerRef.current = null;
    }

    try {
      const allPoints: any[] = [];

      // 处理学校起点标记（保持自定义标记，因为学校需要特殊标识）
      let schoolInfo = null;
      if (isWaypointsFormat(props) && props.schoolInfo) {
        schoolInfo = {
          name: props.schoolInfo.name,
          address: props.schoolInfo.address,
          coordinates: parseCoordinates(props.schoolInfo.coordinates)
        };
      } else if (!isWaypointsFormat(props) && props.schoolOrigin) {
        schoolInfo = {
          name: props.schoolOrigin.name,
          address: props.schoolOrigin.address,
          coordinates: { lng: props.schoolOrigin.position[0], lat: props.schoolOrigin.position[1] }
        };
      }

      if (schoolInfo && schoolInfo.coordinates) {
        const schoolPoint = new BMapGL.Point(schoolInfo.coordinates.lng, schoolInfo.coordinates.lat);
        allPoints.push(schoolPoint);

        // 创建学校标记（继续使用自定义标记）
        const schoolIcon = new BMapGL.Icon(
          'data:image/svg+xml;base64,' + safeBase64Encode(`
            <svg width="52" height="68" xmlns="http://www.w3.org/2000/svg">
              <!-- 地图标记外观 -->
              <path d="M26 2C16.6 2 9 9.6 9 19c0 14 17 45 17 45s17-31 17-45c0-9.4-7.6-17-17-17z" fill="#52c41a" stroke="#fff" stroke-width="3"/>
              <!-- 内部圆圈 -->
              <circle cx="26" cy="19" r="14" fill="#fff"/>
              <!-- 学校图标 -->
              <path d="M16 12h20v2H16zm0 4h20v2H16z" fill="#52c41a"/>
              <rect x="18" y="18" width="16" height="8" fill="none" stroke="#52c41a" stroke-width="1.5"/>
              <path d="M20 20h2v4h-2zm4 0h2v4h-2zm4 0h2v4h-2zm4 0h2v4h-2z" fill="#52c41a"/>
              <text x="26" y="28" text-anchor="middle" fill="#52c41a" font-size="8" font-weight="bold">校</text>
            </svg>
          `),
          new BMapGL.Size(52, 68),
          { anchor: new BMapGL.Size(26, 68) }
        );
        
        const schoolMarker = new BMapGL.Marker(schoolPoint);
        schoolMarker.setIcon(schoolIcon);
        
        // 🎯 优化学校信息窗体
        const schoolInfoWindow = new BMapGL.InfoWindow(`
          <div style="padding: 12px; min-width: 280px; font-family: 'Microsoft YaHei', sans-serif;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: #52c41a; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; margin-right: 8px;">校</div>
              <h4 style="margin: 0; color: #52c41a; font-size: 16px;">🏫 研学起点</h4>
            </div>
            <p style="margin: 4px 0; color: #666; font-weight: bold; font-size: 14px;">${schoolInfo.name}</p>
            <p style="margin: 4px 0; color: #666; font-size: 13px;">📍 ${schoolInfo.address}</p>
            <div style="margin-top: 8px; padding: 6px 8px; background: #f6ffed; border-radius: 4px; border-left: 3px solid #52c41a;">
              <p style="margin: 0; color: #52c41a; font-size: 12px; font-weight: bold;">🎓 研学集合点 - 出发/返回</p>
            </div>
          </div>
        `, {
          width: 300,
          height: 150
        });

        schoolMarker.addEventListener('mouseover', () => {
          map.openInfoWindow(schoolInfoWindow, schoolPoint);
        });

        schoolMarker.addEventListener('mouseout', () => {
          map.closeInfoWindow();
        });

        map.addOverlay(schoolMarker);
        schoolMarkerRef.current = schoolMarker;
      }

      // 🎯 处理研学地点标记 - 混合策略：POI + 自定义编号
      if (isWaypointsFormat(props)) {
        // waypoints格式
        const sortedWaypoints = [...(props.waypoints || [])].sort((a, b) => a.waypointOrder - b.waypointOrder);
        
        sortedWaypoints.forEach((waypoint, index) => {
          const location = waypoint.coursePlanItem?.studyLocation;
          if (!location) return;

          const coords = parseCoordinates(location.coordinates);
          const point = coords 
            ? new BMapGL.Point(coords.lng, coords.lat)
            : new BMapGL.Point(MAP_CONFIG.defaultCenter[0] + (index * 0.01), MAP_CONFIG.defaultCenter[1] + (index * 0.01));

          allPoints.push(point);

          // 🎯 使用混合标记策略
          if (MAP_CONFIG.markerStrategy.prioritizeBaiduPOI) {
            // 为POI地点添加编号标记（小圆圈，叠加在百度地图POI上）
            const numberIcon = new BMapGL.Icon(
              'data:image/svg+xml;base64,' + safeBase64Encode(`
                <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <!-- 外圆圈 -->
                  <circle cx="12" cy="12" r="11" fill="#ff4d4f" stroke="#fff" stroke-width="2"/>
                  <!-- 数字 -->
                  <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">${index + 1}</text>
                </svg>
              `),
              new BMapGL.Size(24, 24),
              { anchor: new BMapGL.Size(12, 12) }
            );

            const numberMarker = new BMapGL.Marker(point);
            numberMarker.setIcon(numberIcon);

            // 为编号标记添加信息窗体
            const infoWindow = new BMapGL.InfoWindow(`
              <div style="padding: 12px; min-width: 280px; font-family: 'Microsoft YaHei', sans-serif;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: #ff4d4f; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 8px;">${index + 1}</div>
                  <h4 style="margin: 0; color: #1890ff; font-size: 16px;">📍 ${location.nameZh}</h4>
                </div>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">📍 ${location.addressZh}</p>
                ${waypoint.transportToNextWaypointMode ? 
                  `<p style="margin: 4px 0; color: #52c41a; font-size: 13px;">🚶‍♂️ 交通方式: ${waypoint.transportToNextWaypointMode}</p>` : 
                  ''
                }
                <div style="margin-top: 8px; padding: 6px 8px; background: #fff7e6; border-radius: 4px; border-left: 3px solid #fa8c16;">
                  <p style="margin: 0; color: #fa8c16; font-size: 12px; font-weight: bold;">🗺️ 优先显示百度地图POI + 研学编号</p>
                </div>
                <div style="margin-top: 8px; padding: 6px 8px; background: #f0f9ff; border-radius: 4px; border-left: 3px solid #1890ff;">
                  <p style="margin: 0; color: #1890ff; font-size: 12px; font-weight: bold;">🎓 研学站点 - 第${index + 1}站</p>
                </div>
              </div>
            `, {
              width: 300,
              height: 160
            });

            numberMarker.addEventListener('mouseover', () => {
              map.openInfoWindow(infoWindow, point);
            });

            numberMarker.addEventListener('mouseout', () => {
              map.closeInfoWindow();
            });

            map.addOverlay(numberMarker);
            markersRef.current.push(numberMarker);
          } else {
            // 传统自定义标记模式（如果关闭POI优先策略）
            const normalIcon = new BMapGL.Icon(
              'data:image/svg+xml;base64,' + safeBase64Encode(`
                <svg width="48" height="64" xmlns="http://www.w3.org/2000/svg">
                  <!-- 地图标记外观 -->
                  <path d="M24 2C14.6 2 7 9.6 7 19c0 14 17 41 17 41s17-27 17-41c0-9.4-7.6-17-17-17z" fill="#1890ff" stroke="#fff" stroke-width="2"/>
                  <!-- 内部圆圈 -->
                  <circle cx="24" cy="19" r="12" fill="#fff"/>
                  <!-- 数字 -->
                  <text x="24" y="24" text-anchor="middle" fill="#1890ff" font-size="14" font-weight="bold">${index + 1}</text>
                  <!-- 研学图标 -->
                  <path d="M18 13h12v2H18zm2 4h8v2h-8zm-2 4h12v2H18z" fill="#1890ff" opacity="0.3"/>
                </svg>
              `),
              new BMapGL.Size(48, 64),
              { anchor: new BMapGL.Size(24, 64) }
            );

            const marker = new BMapGL.Marker(point);
            marker.setIcon(normalIcon);

            const infoWindow = new BMapGL.InfoWindow(`
              <div style="padding: 12px; min-width: 280px; font-family: 'Microsoft YaHei', sans-serif;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: #1890ff; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 8px;">${index + 1}</div>
                  <h4 style="margin: 0; color: #1890ff; font-size: 16px;">📍 ${location.nameZh}</h4>
                </div>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">📍 ${location.addressZh}</p>
                ${waypoint.transportToNextWaypointMode ? 
                  `<p style="margin: 4px 0; color: #52c41a; font-size: 13px;">🚶‍♂️ 交通方式: ${waypoint.transportToNextWaypointMode}</p>` : 
                  ''
                }
                <div style="margin-top: 8px; padding: 6px 8px; background: #f0f9ff; border-radius: 4px; border-left: 3px solid #1890ff;">
                  <p style="margin: 0; color: #1890ff; font-size: 12px; font-weight: bold;">🎓 研学站点 - 第${index + 1}站</p>
                </div>
              </div>
            `, {
              width: 300,
              height: 140
            });

            marker.addEventListener('mouseover', () => {
              map.openInfoWindow(infoWindow, point);
            });

            marker.addEventListener('mouseout', () => {
              map.closeInfoWindow();
            });

            map.addOverlay(marker);
            markersRef.current.push(marker);
          }
        });
      } else {
        // route+landmark格式
        const { route, selectedLandmark, onLandmarkSelect } = props;
        
        const markers = route.landmarks.map((landmark, index) => {
          const isSelected = landmark.id === selectedLandmark;
          const point = new BMapGL.Point(landmark.position[0], landmark.position[1]);
          
          allPoints.push(point);

          // 🎯 根据策略选择标记方式
          if (MAP_CONFIG.markerStrategy.prioritizeBaiduPOI) {
            // 使用编号圆圈叠加在POI上
            const iconSvg = safeBase64Encode(`
              <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <!-- 外圆圈 -->
                <circle cx="12" cy="12" r="11" fill="${isSelected ? '#ff4d4f' : '#1890ff'}" stroke="#fff" stroke-width="2"/>
                <!-- 数字 -->
                <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">${index + 1}</text>
              </svg>
            `);

            const icon = new BMapGL.Icon(
              'data:image/svg+xml;base64,' + iconSvg,
              new BMapGL.Size(24, 24),
              { anchor: new BMapGL.Size(12, 12) }
            );
            const marker = new BMapGL.Marker(point);
            marker.setIcon(icon);

            marker.addEventListener('click', () => {
              onLandmarkSelect(landmark.id);
            });

            const infoWindow = new BMapGL.InfoWindow(`
              <div style="padding: 12px; min-width: 280px; font-family: 'Microsoft YaHei', sans-serif;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: ${isSelected ? '#ff4d4f' : '#1890ff'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 8px;">${index + 1}</div>
                  <h4 style="margin: 0; color: ${isSelected ? '#ff4d4f' : '#1890ff'}; font-size: 16px;">📍 ${landmark.name}</h4>
                </div>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">📍 ${landmark.address}</p>
                <p style="margin: 4px 0; color: #52c41a; font-size: 13px;">⏰ 游览时间: ${landmark.duration}</p>
                <div style="margin-top: 8px; padding: 6px 8px; background: #fff7e6; border-radius: 4px; border-left: 3px solid #fa8c16;">
                  <p style="margin: 0; color: #fa8c16; font-size: 12px; font-weight: bold;">🗺️ 百度地图POI + 研学编号</p>
                </div>
                <div style="margin-top: 8px; padding: 6px 8px; background: ${isSelected ? '#fff2f0' : '#f0f9ff'}; border-radius: 4px; border-left: 3px solid ${isSelected ? '#ff4d4f' : '#1890ff'};">
                  <p style="margin: 0; color: ${isSelected ? '#ff4d4f' : '#1890ff'}; font-size: 12px; font-weight: bold;">🎓 研学站点 - 第${index + 1}站 ${isSelected ? '(已选择)' : ''}</p>
                </div>
              </div>
            `, {
              width: 300,
              height: 170
            });

            marker.addEventListener('mouseover', () => {
              map.openInfoWindow(infoWindow, point);
            });

            marker.addEventListener('mouseout', () => {
              map.closeInfoWindow();
            });

            map.addOverlay(marker);
            return marker;
          } else {
            // 传统大标记模式
            const iconSvg = safeBase64Encode(`
              <svg width="48" height="64" xmlns="http://www.w3.org/2000/svg">
                <!-- 地图标记外观 -->
                <path d="M24 2C14.6 2 7 9.6 7 19c0 14 17 41 17 41s17-27 17-41c0-9.4-7.6-17-17-17z" fill="${isSelected ? '#ff4d4f' : '#1890ff'}" stroke="#fff" stroke-width="2"/>
                <!-- 内部圆圈 -->
                <circle cx="24" cy="19" r="12" fill="#fff"/>
                <!-- 数字 -->
                <text x="24" y="24" text-anchor="middle" fill="${isSelected ? '#ff4d4f' : '#1890ff'}" font-size="14" font-weight="bold">${index + 1}</text>
                <!-- 研学图标 -->
                <path d="M18 13h12v2H18zm2 4h8v2h-8zm-2 4h12v2H18z" fill="${isSelected ? '#ff4d4f' : '#1890ff'}" opacity="0.3"/>
              </svg>
            `);

            const icon = new BMapGL.Icon(
              'data:image/svg+xml;base64,' + iconSvg,
              new BMapGL.Size(48, 64),
              { anchor: new BMapGL.Size(24, 64) }
            );
            const marker = new BMapGL.Marker(point);
            marker.setIcon(icon);

            marker.addEventListener('click', () => {
              onLandmarkSelect(landmark.id);
            });

            const infoWindow = new BMapGL.InfoWindow(`
              <div style="padding: 12px; min-width: 280px; font-family: 'Microsoft YaHei', sans-serif;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: ${isSelected ? '#ff4d4f' : '#1890ff'}; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 8px;">${index + 1}</div>
                  <h4 style="margin: 0; color: ${isSelected ? '#ff4d4f' : '#1890ff'}; font-size: 16px;">📍 ${landmark.name}</h4>
                </div>
                <p style="margin: 4px 0; color: #666; font-size: 13px;">📍 ${landmark.address}</p>
                <p style="margin: 4px 0; color: #52c41a; font-size: 13px;">⏰ 游览时间: ${landmark.duration}</p>
                <div style="margin-top: 8px; padding: 6px 8px; background: ${isSelected ? '#fff2f0' : '#f0f9ff'}; border-radius: 4px; border-left: 3px solid ${isSelected ? '#ff4d4f' : '#1890ff'};">
                  <p style="margin: 0; color: ${isSelected ? '#ff4d4f' : '#1890ff'}; font-size: 12px; font-weight: bold;">🎓 研学站点 - 第${index + 1}站 ${isSelected ? '(已选择)' : ''}</p>
                </div>
              </div>
            `, {
              width: 300,
              height: 150
            });

            marker.addEventListener('mouseover', () => {
              map.openInfoWindow(infoWindow, point);
            });

            marker.addEventListener('mouseout', () => {
              map.closeInfoWindow();
            });

            map.addOverlay(marker);
            return marker;
          }
        });

        markersRef.current = markers;
      }

      // 如果有学校信息，将学校作为终点加入路径，形成闭环
      if (schoolInfo && schoolInfo.coordinates && allPoints.length > 1) {
        const schoolPoint = new BMapGL.Point(schoolInfo.coordinates.lng, schoolInfo.coordinates.lat);
        allPoints.push(schoolPoint);
      }

      // 绘制路线
      if (allPoints.length > 1) {
        const getRouteColor = () => {
          if (isWaypointsFormat(props)) {
            return '#1890ff';
          } else {
            const mode = props.route.transportMode?.toLowerCase() || 'default';
            return ROUTE_COLORS[mode as keyof typeof ROUTE_COLORS] || ROUTE_COLORS.default;
          }
        };

        const polyline = new BMapGL.Polyline(allPoints, {
          strokeColor: getRouteColor(),
          strokeWeight: MAP_CONFIG.routeStyle.strokeWeight,
          strokeOpacity: MAP_CONFIG.routeStyle.strokeOpacity
        });
        
        map.addOverlay(polyline);
        polylineRef.current = polyline;

        map.setViewport(allPoints);
      } else if (allPoints.length === 1) {
        map.centerAndZoom(allPoints[0], 15);
      }

    } catch (err) {
      console.error('地图更新失败:', err);
      setError('地图显示失败');
    }
  }, [props, initialized]);

  // 获取容器高度
  const getHeight = () => {
    if (isWaypointsFormat(props) && props.height) {
      return props.height;
    }
    return '400px';
  };

  if (error) {
    return (
      <div 
        style={{ 
          height: getHeight(), 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          color: '#ff4d4f'
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: getHeight() }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 1000
        }}>
          <Spin size="large">
            <div style={{ padding: '20px' }}>正在加载地图...</div>
          </Spin>
        </div>
      )}
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
    </div>
  );
};

export default RouteMap; 