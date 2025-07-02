/**
 * 坐标接口
 */
export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * 学校信息接口
 */
export interface SchoolInfo {
  name: string;
  address: string;
  coordinates?: Coordinates;
  extractedFrom: 'prompt' | 'structured_params' | 'default' | 'manual';
  geocodingSuccess: boolean;
}

/**
 * 研学地点接口
 */
export interface StudyLocation {
  id?: string;
  name: string;
  address: string;
  coordinates?: Coordinates;
  description?: string;
  category?: string;
  estimatedDuration?: number; // 预计停留时间（分钟）
}

/**
 * 途经点接口
 */
export interface Waypoint {
  order: number;
  type: 'school_origin' | 'study_location' | 'school_return';
  name: string;
  address: string;
  coordinates?: Coordinates;
  estimatedArrivalTime?: string;
  estimatedDepartureTime?: string;
}

/**
 * 路线段接口
 */
export interface RouteSegment {
  order: number;
  from: string;
  to: string;
  durationSeconds: number;
  durationMinutes: number;
  distanceMeters: number;
  distanceKilometers: number;
  mode: string;
}

/**
 * 路线摘要接口
 */
export interface RouteSummary {
  title: string;
  schoolName: string;
  totalLocations: number;
  totalDurationHours: number;
  totalDistanceKilometers: number;
  routeType: string;
  description: string;
}

/**
 * 完整路线接口
 */
export interface Route {
  id: string;
  name: string;
  totalDurationMinutes: number;
  totalDistanceKilometers: number;
  transportMode: string;
  routeType: string;
  waypoints: Waypoint[];
  routeSegments: RouteSegment[];
  summary: RouteSummary;
  schoolOrigin: SchoolInfo;
  optimized: boolean;
  createdAt: string;
}

/**
 * 交通方式类型
 */
export type TransportMode = 'driving' | 'walking' | 'riding' | 'transit';

/**
 * 路线验证结果接口
 */
export interface RouteValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
}

/**
 * 路线优化约束接口
 */
export interface RouteOptimizationConstraints {
  maxTravelTime?: number;
  transportPreference?: string;
  avoidTolls?: boolean;
  startTime?: string;
}

/**
 * 地理编码请求接口
 */
export interface GeocodeRequest {
  name: string;
  address: string;
  city?: string;
}

/**
 * 地理编码响应接口
 */
export interface GeocodeResult {
  name: string;
  address: string;
  success: boolean;
  coordinates?: Coordinates;
  precise?: boolean;
  confidence?: number;
  error?: string;
} 