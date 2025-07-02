// 路线规划服务
import axios from 'axios';
import { SchoolInfo, StudyLocation, Route, Waypoint, RouteSegment, GeocodeRequest, Coordinates, TransportMode } from '../types/route';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * 路线选项接口
 */
export interface RouteOption {
  id: string;
  name: string;
  mode: TransportMode;
  distance: number;
  duration: number;
  polyline?: [number, number][];
  description?: string;
  legs: any[];
  instructions: string[];
  schoolOrigin?: SchoolInfo;
  totalDurationMinutes: number;
  totalDistanceKilometers: number;
  transportMode: TransportMode;
  carbonFootprint: number;
  cost: number;
  recommendedFor: string[];
  waypoints: Waypoint[];
  routeSegments: RouteSegment[];
  pros: string[];
  cons: string[];
}

/**
 * 百度地图路线规划结果接口
 */
export interface BaiduMapRouteResult {
  routes: Array<{
    distance: number;
    duration: number;
    destination?: string;
    steps: Array<{
      instruction: string;
      distance: number;
      duration: number;
    }>;
  }>;
  totalDuration: number;
  totalDistance: number;
  optimized: boolean;
  schoolOrigin?: SchoolInfo;
}

/**
 * 百度地图MCP路线规划服务
 * 实现基于学校起点的闭环路径规划
 */
export class RoutePlanningService {

  /**
   * 提取学校信息并进行地理编码
   * @param studyPlanId 研学方案ID
   * @returns 学校信息
   */
  static async extractSchoolInfo(studyPlanId: number): Promise<SchoolInfo> {
    try {
      const response = await fetch(`${API_BASE_URL}/study-plans/${studyPlanId}/extract-school-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        name: data.name,
        address: data.address,
        coordinates: data.coordinates,
        extractedFrom: data.extracted_from,
        geocodingSuccess: data.geocoding_success
      };
    } catch (error) {
      console.error('提取学校信息失败:', error);
      throw error;
    }
  }

  /**
   * 地理编码 - 将地址转换为坐标
   * @param address 地址
   * @param city 城市（可选）
   * @returns 地理编码结果
   */
  static async geocode(address: string, city?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/baidu-map/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, city }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('地理编码失败:', error);
      throw error;
    }
  }

  /**
   * 批量地理编码
   * @param addresses 地址列表
   * @returns 批量地理编码结果
   */
  static async batchGeocode(addresses: GeocodeRequest[]): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/baidu-map/batch-geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('批量地理编码失败:', error);
      throw error;
    }
  }

  /**
   * 规划闭环路径 - 从学校出发，经过各个研学地点，最后回到学校
   * @param schoolInfo 学校信息
   * @param studyLocations 研学地点列表
   * @param transportMode 交通方式（driving, walking, riding, transit）
   * @returns 闭环路径规划结果
   */
  static async planCircularRoute(
    schoolInfo: SchoolInfo,
    studyLocations: StudyLocation[],
    transportMode: string = 'driving'
  ): Promise<Route> {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/baidu-map/multi-route-planning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schoolInfo,
          studyLocations,
          transportMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // 转换为前端Route类型
      return {
        id: `circular-route-${Date.now()}`,
        name: data.summary?.title || '研学闭环路线',
        totalDurationMinutes: data.totalDurationMinutes,
        totalDistanceKilometers: data.totalDistanceKilometers,
        transportMode: data.transportMode,
        routeType: data.routeType,
        waypoints: data.waypoints || [],
        routeSegments: data.routeSegments || [],
        summary: data.summary,
        schoolOrigin: data.schoolOrigin,
        optimized: true,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('闭环路径规划失败:', error);
      throw error;
    }
  }

  /**
   * 计算两点间路线
   * @param origin 起点坐标或地址
   * @param destination 终点坐标或地址
   * @param mode 交通方式
   * @returns 路线规划结果
   */
  static async calculateRoute(
    origin: string,
    destination: string,
    mode: string = 'driving'
  ): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/mcp/baidu-map/directions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ origin, destination, mode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('路线计算失败:', error);
      throw error;
    }
  }

  /**
   * 优化研学路线
   * @param studyPlanId 研学方案ID
   * @param locations 研学地点列表
   * @param constraints 优化约束
   * @returns 优化后的路线
   */
  static async optimizeStudyRoute(
    studyPlanId: number,
    locations: StudyLocation[],
    constraints: {
      maxTravelTime?: number;
      transportPreference?: string;
      avoidTolls?: boolean;
      startTime?: string;
    } = {}
  ): Promise<Route> {
    try {
      // 1. 首先提取学校信息
      const schoolInfo = await this.extractSchoolInfo(studyPlanId);

      // 2. 确保所有研学地点都有坐标
      const locationsWithCoords = await this.ensureLocationsHaveCoordinates(locations);

      // 3. 规划闭环路径
      const route = await this.planCircularRoute(
        schoolInfo,
        locationsWithCoords,
        constraints.transportPreference || 'driving'
      );

      return route;
    } catch (error) {
      console.error('路线优化失败:', error);
      throw error;
    }
  }

  /**
   * 确保所有研学地点都有坐标
   * @param locations 研学地点列表
   * @returns 带有坐标的研学地点列表
   */
  private static async ensureLocationsHaveCoordinates(
    locations: StudyLocation[]
  ): Promise<StudyLocation[]> {
    const locationsWithoutCoords = locations.filter(
      loc => !loc.coordinates || (!loc.coordinates.lat && !loc.coordinates.lon)
    );

    if (locationsWithoutCoords.length > 0) {
      // 批量地理编码
      const addressList: GeocodeRequest[] = locationsWithoutCoords.map(loc => ({
        name: loc.name,
        address: loc.address,
      }));

      const geocodeResults = await this.batchGeocode(addressList);

      if (geocodeResults.status === 'success') {
        geocodeResults.results.forEach((result: any, index: number) => {
          if (result.success) {
            const location = locationsWithoutCoords[index];
            location.coordinates = {
              lat: result.coordinates.lat,
              lon: result.coordinates.lon,
            };
          }
        });
      }
    }

    return locations;
  }

  /**
   * 生成路线摘要信息
   * @param route 路线信息
   * @returns 路线摘要
   */
  static generateRouteSummary(route: Route): string {
    const duration = Math.round(route.totalDurationMinutes);
    const distance = route.totalDistanceKilometers.toFixed(1);
    const waypointCount = route.waypoints.length;

    return `从${route.schoolOrigin.name}出发，经过${waypointCount - 2}个研学地点，最后返回学校。总行程约${duration}分钟，${distance}公里。`;
  }

  /**
   * 导出路线到地图服务
   * @param route 路线信息
   * @returns 地图服务URL
   */
  static exportToMapService(route: Route): string {
    // 构建百度地图URL
    const waypoints = route.waypoints.map((wp: Waypoint) => 
      `${wp.coordinates?.lat},${wp.coordinates?.lon}`
    ).join('|');
    
    return `https://api.map.baidu.com/marker?markers=${waypoints}&coord_type=gcj02`;
  }

  /**
   * 获取路线详细指引
   * @param routeSegments 路线段信息
   * @returns 详细指引文本
   */
  static getRouteInstructions(routeSegments: RouteSegment[]): string[] {
    return routeSegments.map((segment: RouteSegment, index: number) => {
      const duration = Math.round(segment.durationMinutes);
      const distance = segment.distanceKilometers.toFixed(1);
      
      return `${index + 1}. 从${segment.from}前往${segment.to}，预计${duration}分钟，${distance}公里`;
    });
  }

  /**
   * 计算路线的碳排放
   * @param route 路线信息
   * @returns 碳排放量（千克CO2）
   */
  static calculateCarbonFootprint(route: Route): number {
    const distance = route.totalDistanceKilometers;
    
    // 根据交通方式计算碳排放系数
    const emissionFactors = {
      driving: 0.21,    // 千克CO2/公里（私家车）
      transit: 0.05,    // 千克CO2/公里（公共交通）
      walking: 0,       // 步行无碳排放
      riding: 0,        // 骑行无碳排放
    };

    const factor = emissionFactors[route.transportMode as keyof typeof emissionFactors] || 0.21;
    return distance * factor;
  }

  /**
   * 验证路线的可行性
   * @param route 路线信息
   * @returns 验证结果
   */
  static validateRoute(route: Route): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 检查总时长
    if (route.totalDurationMinutes > 480) { // 8小时
      warnings.push('路线总时长超过8小时，可能过于疲劳');
      suggestions.push('考虑减少研学地点或分成多天行程');
    }

    // 检查段距离
    route.routeSegments?.forEach((segment, index) => {
      if (segment.durationMinutes > 60) {
        warnings.push(`第${index + 1}段路程时间较长（${segment.durationMinutes}分钟）`);
        suggestions.push('考虑在中途安排休息点');
      }
    });

    // 检查交通方式
    if (route.transportMode === 'walking' && route.totalDistanceKilometers > 5) {
      warnings.push('步行距离较长，可能不适合学生');
      suggestions.push('考虑使用公共交通或包车');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions,
    };
  }

  /**
   * 使用百度地图MCP优化多点路线
   * @param studyPlanId 研学方案ID
   * @param options 优化选项
   * @returns 优化后的路线结果
   */
  static async optimizeMultiPointRouteWithBaiduMap(
    studyPlanId: number,
    options: {
      transportMode?: TransportMode;
      optimizeOrder?: boolean;
      useBaiduMap?: boolean;
    }
  ): Promise<BaiduMapRouteResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/study-plans/${studyPlanId}/generate-optimized-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optimizationParameters: {
            useBaiduMap: true,
            optimizeOrder: options.optimizeOrder !== false,
          },
          transportMode: options.transportMode || 'driving',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 转换为BaiduMapRouteResult格式
      return {
        routes: data.route?.waypoints?.map((waypoint: any, index: number) => ({
          distance: 1000 + index * 500, // 模拟距离
          duration: waypoint.transportToNextWaypointDurationMinutes * 60 || 1800, // 转换为秒
          steps: [{
            instruction: `前往${waypoint.coursePlanItem?.locationName || '目的地'}`,
            distance: 1000,
            duration: 1800,
          }],
        })) || [],
        totalDuration: data.route?.totalEstimatedDurationMinutes * 60 || 10800, // 转换为秒
        totalDistance: data.route?.waypoints?.length * 1500 || 3000, // 估算总距离
        optimized: true,
        schoolOrigin: data.route?.schoolOrigin,
      };
    } catch (error) {
      console.error('百度地图多点路线优化失败:', error);
      throw error;
    }
  }
}

// 导出类型定义
export type { SchoolInfo, StudyLocation, Route, Waypoint, RouteSegment, GeocodeRequest, Coordinates, TransportMode }; 