// 百度地图配置
export const MAP_CONFIG = {
  // 百度地图API密钥
  key: 'mLkt3CXOyJnsgdfHoqczOSGNLAmYkITK',
  
  // 地图默认中心点（上海虹口区中心位置）
  defaultCenter: [121.480419, 31.270459] as [number, number],
  
  // 默认缩放级别
  defaultZoom: 15,
  
  // 地图样式
  mapStyle: 'normal',
  
  // 路线样式
  routeStyle: {
    strokeColor: '#1890ff', // 线条颜色
    strokeWeight: 4,        // 线条宽度
    strokeOpacity: 0.8,     // 线条透明度
    lineJoin: 'round',      // 拐角样式
    lineCap: 'round',       // 端点样式
    strokeStyle: 'solid',   // 线型
    showDir: true           // 显示方向箭头
  },
  
  // 🎯 地图显示选项配置 - 优先显示百度地图原生POI
  displayOptions: {
    poi: true,            // ✅ 启用POI标注，优先使用百度地图原生标识
    building: true,       // 显示建筑轮廓
    indoor: false,        // 隐藏室内图
    traffic: false,       // 隐藏交通流量
    skyColors: true       // 显示天空色彩
  },
  
  // 🎯 标记策略配置
  markerStrategy: {
    prioritizeBaiduPOI: true,  // 优先使用百度地图原生POI
    hybridMode: true,          // 混合模式：POI + 自定义标记
    addCustomNumbers: true     // 为POI添加自定义编号
  },
  
  // 🎯 标记样式配置
  markerStyles: {
    school: {
      width: 52,
      height: 68,
      color: '#52c41a',
      anchor: [26, 68] as [number, number]
    },
    studyLocation: {
      width: 48,
      height: 64,
      color: '#1890ff',
      selectedColor: '#ff4d4f',
      anchor: [24, 64] as [number, number]
    },
    // 自定义编号标记（叠加在POI上）
    poiNumber: {
      width: 24,
      height: 24,
      color: '#ff4d4f',
      backgroundColor: '#fff',
      anchor: [12, 12] as [number, number]
    }
  }
};

// 按路线类型定义不同颜色
export const ROUTE_COLORS = {
  walking: '#1890ff',   // 步行路线
  transit: '#52c41a',   // 公共交通
  driving: '#faad14',   // 驾车
  riding: '#eb2f96',    // 骑行
  default: '#1890ff'    // 默认
}; 