import { API_CONFIG } from '../config/config';

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

class StudyPlanService {
  private baseUrl = API_CONFIG.BASE_URL;

  async getStudyPlan(id: number): Promise<StudyPlan> {
    try {
      const response = await fetch(`${this.baseUrl}/api/study-plans/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 转换数据结构：将后端的route对象转换为前端期望的routes数组
      const transformedData: StudyPlan = {
        id: data.studyPlanId,
        planName: data.planName,
        themeZh: data.themeZh,
        targetAudienceDescription: data.targetAudienceDescription,
        overallLearningObjectives: data.overallLearningObjectives,
        estimatedDurationDescription: data.estimatedDurationDescription,
        budgetDescription: data.budgetDescription,
        status: data.planStatus,
        items: data.planItems || [],
        routes: data.route ? [data.route] : [] // 将单个route对象转换为数组
      };
      
      return transformedData;
    } catch (error) {
      console.error('获取研学方案失败:', error);
      throw error;
    }
  }

  async generateOptimizedRoute(planId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/study-plans/${planId}/optimize-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('路线优化失败:', error);
      throw error;
    }
  }

  async getAllStudyPlans(): Promise<StudyPlan[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/study-plans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('获取研学方案列表失败:', error);
      throw error;
    }
  }
}

export const studyPlanService = new StudyPlanService();
export type { StudyPlan, StudyRoute, RouteWaypoint, CoursePlanItem, StudyLocation }; 