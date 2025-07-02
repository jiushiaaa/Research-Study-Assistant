// 定义路线类型
export interface Landmark {
  id: string;
  name: string;
  address: string;
  position: [number, number]; // 经纬度坐标
  duration: string;
  order?: number;
  activities?: string[];
}

export interface Route {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  grade?: string;
  duration?: string;
  budget?: string;
  transportMode?: string;
  landmarks: Landmark[];
  path: [number, number][]; // 路径点坐标数组
  totalDistance?: number;
  totalDuration?: number;
  schedule?: Array<{
    time: string;
    activity: string;
    type?: string;
  }>;
} 