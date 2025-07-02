import config from '../config/env';

// API基础配置
const API_BASE_URL = config.apiBaseUrl;

// 调试信息：输出当前使用的API URL
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌍 Environment:', config.environment);

// API响应类型定义
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

// 研学方案相关类型
export interface StudyPlanGenerationResponse {
  studyPlanGenerationId: string;
  status: string;
}

// 课程计划项目类型
export interface CoursePlanItemDto {
  id: number;
  studyLocationId: number;
  itemOrder: number;
  estimatedDurationMinutes: number;
  teachingContentSummary?: string;
  activityDescription?: string;
  urbanLivingRoomFocus?: string;
  customActivityDetails?: any;
  locationName?: string;
  locationAddress?: string;
  locationCoordinates?: { lat: number; lon: number };
}

// 路线途经点类型
export interface WaypointDto {
  id: number;
  waypointOrder: number;
  locationName: string;
  locationId: number;
  estimatedArrivalTime?: string;
  estimatedDepartureTime?: string;
  durationMinutes?: number;
  transportToNextWaypoint?: string;
  locationCoordinates?: { lat: number; lon: number };
}

// 路线信息类型
export interface RouteDto {
  id: number;
  routeName: string;
  totalEstimatedDurationMinutes: number;
  transportSummary?: string;
  status: string;
  optimizationParameters?: any;
  waypoints?: WaypointDto[];
}

// 直接路线生成请求
export interface DirectRouteRequest {
  routeName?: string;
  locations: Array<{
    name: string;
    address?: string;
    description?: string;
    duration?: string;
    lat?: number;
    lng?: number;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  optimizationParameters?: {
    transportMode?: string;
    optimizationGoal?: string;
  };
}

// 直接路线生成响应
export interface DirectRouteResponse {
  routeName: string;
  status: string;
  totalEstimatedDurationMinutes?: number;
  transportSummary?: string;
  waypoints?: WaypointDto[];
  optimizationExplanation?: string;
  optimizationScore?: number;
  routeSuggestions?: string[];
  generatedByDirectRoute: boolean;
  timestamp: number;
}

export interface StudyPlanDetailsResponse {
  studyPlanGenerationId: string;
  status: string;
  rawPrompt: string;
  llmErrorMessage?: string;
  structuredDemandParameters?: any;
  
  // 研学方案基本信息
  studyPlanId?: number;
  planName?: string;
  themeZh?: string;
  targetAudienceDescription?: string;
  estimatedDurationDescription?: string;
  budgetDescription?: string;
  overallLearningObjectives?: string;
  planStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // 课程计划项目
  planItems?: CoursePlanItemDto[];
  
  // 路线信息
  studyRoute?: RouteDto;
  
  // 研学手册
  generatedStudyGuide?: any;
  
  // 兼容旧的字段名
  coursePlan?: any;
}

export interface CreateStudyPlanRequest {
  prompt: string;
  learningObjectives?: string[];
  targetGradeLevels?: string[];
  preferredLocations?: string[];
  preferredActivityTypes?: string[];
  estimatedDurationMinutes?: number;
  studentCount?: number;
  budgetDescription?: string;
}

// 景点信息类型
export interface LocationSummary {
  id: number;
  locationUuid: string;
  nameZh: string;
  nameEn?: string;
  addressZh?: string;
  imageUrls?: string[];
  historicalSignificanceTags?: string[];
  artisticFeaturesTags?: string[];
  urbanLivingRoomRelevance?: string;
  connectedThemesZh?: string[];
}

export interface LocationDetails extends LocationSummary {
  coordinates?: { lat: number; lon: number };
  descriptionZh?: string;
  urbanLivingRoomAspects?: string[];
  suggestedArtActivitiesZh?: string[];
  pedagogicalNotesZh?: string;
  openingHoursZh?: string;
  accessibilityInfoZh?: string;
}

// HTTP请求工具函数
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// 研学方案API
export const studyPlanApi = {
  // 创建研学方案
  async createStudyPlan(request: CreateStudyPlanRequest): Promise<StudyPlanGenerationResponse> {
    return fetchApi<StudyPlanGenerationResponse>('/study-plans', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  // 获取研学方案状态和详情
  async getStudyPlanStatus(studyPlanGenerationId: string): Promise<StudyPlanDetailsResponse> {
    return fetchApi<StudyPlanDetailsResponse>(`/study-plans/${studyPlanGenerationId}`);
  },

  // 轮询状态直到完成
  async waitForCompletion(studyPlanGenerationId: string, maxAttempts = 30, interval = 2000): Promise<StudyPlanDetailsResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const result = await this.getStudyPlanStatus(studyPlanGenerationId);
      
      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }
      
      // 等待指定时间后重试
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('超时：研学方案生成时间过长');
  },

  // 生成优化路线
  async generateOptimizedRoute(studyPlanId: number, params: any): Promise<StudyPlanDetailsResponse> {
    return fetchApi<StudyPlanDetailsResponse>(`/study-plans/${studyPlanId}/generate-optimized-route`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // 生成艺术笔记框架
  generateArtNoteFramework: async (studyPlanId: number, params: any): Promise<StudyPlanDetailsResponse> => {
    const response = await fetchApi(`/study-plans/${studyPlanId}/generate-art-note-framework`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return response as StudyPlanDetailsResponse;
  },

  // 生成HTML格式艺术笔记
  generateArtNoteHtml: async (studyPlanId: number, params: any): Promise<any> => {
    const response = await fetchApi(`/study-plans/${studyPlanId}/generate-art-note-html`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return response;
  },

  // 编译研学手册
  async compileStudyGuide(studyPlanId: number, params: any): Promise<any> {
    return fetchApi<any>(`/study-plans/${studyPlanId}/compile-guide`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // 直接生成路线（绕过数据库依赖）
  generateDirectRoute: async (request: DirectRouteRequest): Promise<DirectRouteResponse> => {
    const response = await fetchApi('/study-plans/direct-route/generate', {
      method: 'POST',
      body: JSON.stringify(request)
    });
    return response as DirectRouteResponse;
  }
};

// 景点API
export const locationApi = {
  // 获取景点列表
  async getLocations(params: {
    keywords?: string;
    theme?: string;
    gradeLevel?: string;
    activityType?: string;
    page?: number;
    size?: number;
  } = {}): Promise<{ content: LocationSummary[]; totalElements: number; totalPages: number }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    const endpoint = `/locations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return fetchApi<{ content: LocationSummary[]; totalElements: number; totalPages: number }>(endpoint);
  },

  // 获取都市客厅相关景点
  async getUrbanLivingRoomLocations(page = 0, size = 10): Promise<{ content: LocationSummary[]; totalElements: number; totalPages: number }> {
    return fetchApi<{ content: LocationSummary[]; totalElements: number; totalPages: number }>(`/locations/urban-living-room?page=${page}&size=${size}`);
  },

  // 获取景点详情
  async getLocationDetails(locationUuid: string): Promise<LocationDetails> {
    return fetchApi<LocationDetails>(`/locations/${locationUuid}`);
  },

  // 根据ID获取景点详情
  async getLocationById(locationId: number): Promise<LocationDetails> {
    return fetchApi<LocationDetails>(`/locations/id/${locationId}`);
  },
};

export default {
  studyPlanApi,
  locationApi,
}; 