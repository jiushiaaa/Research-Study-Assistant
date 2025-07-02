import React, { createContext, useContext, useState, ReactNode } from 'react';
import { LocationSummary, StudyPlanDetailsResponse } from '../services/apiService';

// 工作流数据接口
export interface WorkflowData {
  // 教师输入
  teacherPrompt?: string;
  studyPlanGenerationId?: string;
  
  // 景点选择
  selectedLocations?: LocationSummary[];
  
  // 课程规划
  coursePlan?: any;
  
  // 路线设计
  studyRoute?: any;
  
  // 艺术笔记
  artNoteFramework?: any;
  artNoteHtml?: string;
  
  // 完整方案
  fullStudyPlan?: StudyPlanDetailsResponse;
}

// 工作流上下文接口
interface WorkflowContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  workflowData: WorkflowData;
  setWorkflowData: (data: Partial<WorkflowData>) => void;
  updateWorkflowData: (updates: Partial<WorkflowData>) => void;
  isInWorkflow: boolean;
  setIsInWorkflow: (inWorkflow: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetWorkflow: () => void;
  clearCache: () => void;
  
  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 错误状态
  error: string | null;
  setError: (error: string | null) => void;
}

// 创建上下文
const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// 工作流提供者组件
export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [workflowData, setWorkflowDataState] = useState<WorkflowData>({});
  const [isInWorkflow, setIsInWorkflow] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 更新工作流数据
  const setWorkflowData = (data: Partial<WorkflowData>) => {
    setWorkflowDataState(data);
  };

  // 增量更新工作流数据
  const updateWorkflowData = (updates: Partial<WorkflowData>) => {
    setWorkflowDataState(prev => ({ ...prev, ...updates }));
  };

  // 下一步
  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  // 上一步
  const previousStep = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  // 重置工作流
  const resetWorkflow = () => {
    setWorkflowData({
      teacherPrompt: '',
      selectedLocations: [],
      fullStudyPlan: undefined,
      coursePlan: undefined
    });
    setCurrentStep(0);
  };

  // 清除缓存数据
  const clearCache = () => {
    localStorage.removeItem('workflowData');
    localStorage.removeItem('currentCoursePlan');
    resetWorkflow();
  };

  const value = {
    currentStep,
    setCurrentStep,
    workflowData,
    setWorkflowData,
    updateWorkflowData,
    isInWorkflow,
    setIsInWorkflow,
    nextStep,
    previousStep,
    resetWorkflow,
    clearCache,
    isLoading,
    setIsLoading,
    error,
    setError
  };

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
};

// 使用工作流上下文的 Hook
export const useWorkflow = (): WorkflowContextType => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}; 