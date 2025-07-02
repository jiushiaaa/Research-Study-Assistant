import React, { useState, useEffect } from 'react';
import { Typography, Card, Divider, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import InputForm from '../components/TeacherInput/InputForm';
import ClarifyDialog from '../components/TeacherInput/ClarifyDialog';
import axios from 'axios';

const { Title, Paragraph } = Typography;

// 示例提示词列表
const EXAMPLE_PROMPTS = [
  "为五年级学生设计半天虹口红色文化研学，预算≤50元/人",
  "初中一年级学生，1天时间，探索虹口区石库门建筑，侧重艺术特色",
  "高中学生，为期2天的虹口工业遗迹研学，包含1933老场坊，注重历史与现代转型",
  "小学四年级，多伦路文化名人街研学，文学主题，2小时，公共交通"
];

// 澄清问题示例
const CLARIFICATION_QUESTIONS = {
  artForm: {
    question: "您希望侧重哪种艺术形式？",
    options: ["建筑", "雕塑", "绘画", "音乐", "戏剧", "文学", "其他"]
  },
  transportMode: {
    question: "您计划使用哪种交通方式？",
    options: ["步行", "公共交通", "校车", "不限"]
  },
  specialNeeds: {
    question: "是否有特殊需求？",
    options: ["无障碍设施", "适合雨天", "室内活动为主", "无特殊需求"]
  }
};

interface ClarificationQuestion {
  key: string;
  question: string;
  options: string[];
}

// API服务
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1';

// 添加模拟模式，在后端服务不可用时使用
const USE_MOCK_MODE = false; // 设置为true开启模拟模式，false使用真实API

// MCP服务器地址
const MCP_HOST = 'http://localhost:8081/api/v1';

// 研学方案状态类型
interface StudyPlanStatus {
  studyPlanGenerationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  studyPlanId?: string;
  llmErrorMessage?: string;
}

// API服务
const studyPlanService = {
  parsePrompt: async (prompt: string) => {
    try {
      console.log('发送解析请求:', prompt);
      
      // 尝试直接调用MCP服务
      try {
        // 构建请求对象，符合MCP服务接口格式
        const mcpResponse = await axios.post(`${MCP_HOST}/llm/parse-prompt`, {
          requestId: `req-${Date.now()}`,
          operation: "parse_prompt",
          parameters: {
            prompt: prompt,
            parseMode: "detailed"
          },
          metadata: {
            source: "teacherApp",
            timestamp: new Date().toISOString()
          }
        });
        
        console.log('MCP解析响应:', mcpResponse.data);
        return mcpResponse.data;
      } catch (mcpError) {
        console.error('直接调用MCP失败，尝试通过后端调用:', mcpError);
        
        // 调用失败，改为通过后端调用
        const backendResponse = await axios.post(`${API_BASE_URL}/mcp/parse-prompt`, {
          prompt: prompt,
          parseMode: "detailed"
        });
        
        console.log('后端解析响应:', backendResponse.data);
        return backendResponse.data;
      }
    } catch (error) {
      console.error('解析提示词失败:', error);
      throw error;
    }
  },
  
  generateStudyPlan: async (prompt: string, parsedData: any) => {
    try {
      console.log('发送生成方案请求:', parsedData);
      
      // 根据解析结果构建课程方案请求
      const planRequest = {
        requestId: `req-${Date.now()}`,
        operation: "generate_preliminary_plan",
        parameters: {
          teachingRequirements: {
            gradeLevel: parsedData.recognizedGradeLevels?.join(', ') || '未指定',
            subject: "综合实践",
            theme: parsedData.structuredDemandParameters?.culturalTheme || '城市探索',
            duration: parsedData.structuredDemandParameters?.duration || '未指定',
            locations: parsedData.recognizedLocationRequirements || []
          },
          availableLocations: parsedData.recognizedLocationRequirements?.map((location: string) => ({
            name: location,
            category: "城市场所",
            features: [],
          })) || [],
          optimizationParameters: {
            prioritizeEducationalValue: 0.7,
            prioritizeStudentEngagement: 0.3
          }
        },
        metadata: {
          source: "teacherApp",
          timestamp: new Date().toISOString()
        }
      };
      
      // 尝试直接调用MCP服务
      try {
        const mcpResponse = await axios.post(`${MCP_HOST}/course-planning/generate-preliminary-plan`, planRequest);
        console.log('MCP生成方案完整响应:', mcpResponse);
        console.log('MCP生成方案响应数据:', mcpResponse.data);
        
        // 查看数据结构的所有层次
        if (mcpResponse.data) {
          console.log('MCP响应data层:', mcpResponse.data);
          if (mcpResponse.data.data) {
            console.log('MCP响应data.data层:', mcpResponse.data.data);
          }
          if (mcpResponse.data.result) {
            console.log('MCP响应data.result层:', mcpResponse.data.result);
          }
          if (mcpResponse.data.response) {
            console.log('MCP响应data.response层:', mcpResponse.data.response);
          }
        }
        
        return mcpResponse.data;
      } catch (mcpError) {
        console.error('直接调用MCP失败，尝试通过后端调用:', mcpError);
        
        // 调用失败，改为通过后端调用
        const backendResponse = await axios.post(`${API_BASE_URL}/course-planning/generate-preliminary-plan`, planRequest);
        console.log('后端生成方案完整响应:', backendResponse);
        console.log('后端生成方案响应数据:', backendResponse.data);
        
        // 同样检查后端响应的数据结构
        if (backendResponse.data) {
          console.log('后端响应data层:', backendResponse.data);
          if (backendResponse.data.data) {
            console.log('后端响应data.data层:', backendResponse.data.data);
          }
        }
        
        return backendResponse.data;
      }
    } catch (error) {
      console.error('生成研学方案失败:', error);
      throw error;
    }
  },
  
  pollStudyPlanStatus: async (generationId: string, callback: (status: StudyPlanStatus) => void) => {
    const checkStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/study-plans/${generationId}/status`);
        const status: StudyPlanStatus = response.data.data || response.data;
        
        console.log('轮询状态响应:', status);
        callback(status);
        
        if (status.status === 'pending' || status.status === 'processing') {
          // 继续轮询
          setTimeout(checkStatus, 3000);
        }
      } catch (error) {
        console.error('获取研学方案状态失败:', error);
        // 发生错误时返回失败状态
        callback({
          studyPlanGenerationId: generationId,
          status: 'failed',
          progress: 0,
          llmErrorMessage: '无法连接到服务器，请稍后再试'
        });
      }
    };
    
    // 开始轮询
    checkStatus();
  }
};

// 模拟服务
const mockStudyPlanService = {
  parsePrompt: async (prompt: string) => {
    console.log('模拟解析提示词:', prompt);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      data: {
        recognizedGradeLevels: ["五年级"],
        structuredDemandParameters: {
          culturalTheme: prompt.includes('红色') ? '红色文化' : '城市探索',
          duration: prompt.includes('半天') ? '半天' : '一天',
          budget: prompt.includes('预算') ? '50元/人' : '未指定'
        },
        recognizedLocationRequirements: ["虹口区"],
        confidenceScore: 0.92
      }
    };
  },
  
  generateStudyPlan: async (prompt: string, parsedData: any) => {
    console.log('模拟生成研学方案:', parsedData);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      data: {
        studyPlanGenerationId: `mock-${Date.now()}`
      }
    };
  },
  
  pollStudyPlanStatus: async (generationId: string, callback: (status: StudyPlanStatus) => void) => {
    console.log('模拟轮询状态:', generationId);
    
    // 模拟进度更新
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.2;
      if (progress >= 1) {
        clearInterval(interval);
        callback({
          studyPlanGenerationId: generationId,
          status: 'completed',
          progress: 1,
          studyPlanId: `plan-${Date.now()}`
        });
      } else {
        callback({
          studyPlanGenerationId: generationId,
          status: 'processing',
          progress: progress
        });
      }
    }, 1000);
  }
};

// 选择使用真实服务还是模拟服务
const activeService = USE_MOCK_MODE ? mockStudyPlanService : studyPlanService;

const TeacherInputPage: React.FC = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<ClarificationQuestion | null>(null);
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [clarificationResponses, setClarificationResponses] = useState<Record<string, string>>({});
  
  // 添加状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studyPlanStatus, setStudyPlanStatus] = useState<StudyPlanStatus | null>(null);

  // 配置axios默认值
  useEffect(() => {
    // 添加请求拦截器，自动添加API密钥
    axios.interceptors.request.use(
      config => {
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器，统一处理错误
    axios.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        console.error('API请求错误:', error);
        if (error.response) {
          console.error('错误响应数据:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // 处理提示词提交
  const handlePromptSubmit = (text: string) => {
    setInputText(text);
    
    // 直接处理提示词，不进行本地澄清检测
    // 由后端的文心一言API处理澄清需求
    processPrompt(text);
  };

  // 处理完整提示词
  const processPrompt = async (prompt: string) => {
    setSubmittedPrompt(prompt);
    setIsLoading(true);
    setError(null);
    
    try {
      message.loading('正在解析教学需求...');
      
      // 调用解析提示词API
      const parsedData = await activeService.parsePrompt(prompt);
      
      if (!parsedData.success) {
        throw new Error(parsedData.message || '解析提示词失败');
      }
      
      message.success('解析完成，正在生成研学方案...');
      
      // 调用生成研学方案API
      const response = await activeService.generateStudyPlan(prompt, parsedData.data);
      console.log('研学方案生成完整响应:', response);
      
      if (!response.success) {
        throw new Error(response.message || '生成研学方案失败');
      }
      
      // 尝试从不同位置获取generationId
      let generationId = null;
      
      // 打印响应的完整结构，帮助调试
      console.log('响应结构:', JSON.stringify(response, null, 2));
      
      // 尝试各种可能的路径
      if (response.data?.studyPlanGenerationId) {
        generationId = response.data.studyPlanGenerationId;
        console.log('从response.data.studyPlanGenerationId获取ID:', generationId);
      } else if (response.data?.data?.studyPlanGenerationId) {
        generationId = response.data.data.studyPlanGenerationId;
        console.log('从response.data.data.studyPlanGenerationId获取ID:', generationId);
      } else if (response.data?.result?.studyPlanGenerationId) {
        generationId = response.data.result.studyPlanGenerationId;
        console.log('从response.data.result.studyPlanGenerationId获取ID:', generationId);
      } else if (response.data?.response?.id) {
        generationId = response.data.response.id;
        console.log('从response.data.response.id获取ID:', generationId);
      } else if (response.data?.id) {
        generationId = response.data.id;
        console.log('从response.data.id获取ID:', generationId);
      } else if (typeof response.data === 'string') {
        // 如果data是字符串，可能是直接返回了ID
        generationId = response.data;
        console.log('从response.data字符串获取ID:', generationId);
      }
      
      // 检查MCP是否直接返回了完整的课程计划数据
      const hasDirectCoursePlanData = response.data?.data?.coursePlanItems || 
                                     response.data?.coursePlanItems;
      
      if (!generationId && !hasDirectCoursePlanData) {
        console.error('未能获取有效的生成ID或课程计划数据:', response);
        throw new Error('未能获取有效的生成ID或课程计划数据，请重试');
      }
      
      if (generationId) {
        console.log('最终获取到研学方案生成ID:', generationId);
        
        // 设置初始状态
        setStudyPlanStatus({
          studyPlanGenerationId: generationId,
          status: 'processing',
          progress: 0
        });
        
        // 开始轮询状态
        await activeService.pollStudyPlanStatus(
          generationId,
          (status) => {
            setStudyPlanStatus(status);
            if (status.status === 'completed') {
              message.success('研学方案生成完成！');
              // 添加导航到结果页面
              if (USE_MOCK_MODE) {
                // 如果是模拟模式，导航到固定的路由页面
                navigate('/routes');
              } else if (status.studyPlanId) {
                // 如果是真实模式，导航到特定的方案详情页
                navigate(`/study-plans/${status.studyPlanId}`);
              }
            } else if (status.status === 'failed') {
              message.error(`生成失败: ${status.llmErrorMessage || '未知错误'}`);
              setError(status.llmErrorMessage || '生成研学方案失败，请重试');
            }
          }
        );
      } else if (hasDirectCoursePlanData) {
        // MCP直接返回了课程计划数据，不需要轮询
        console.log('MCP直接返回了课程计划数据，不需要轮询');
        
        // 模拟完成状态
        setStudyPlanStatus({
          studyPlanGenerationId: `direct-${Date.now()}`,
          status: 'completed',
          progress: 1,
          studyPlanId: `direct-${Date.now()}`
        });
        
        message.success('研学方案生成完成！');
        
        // 存储课程计划数据（这里可以添加到localStorage或全局状态）
        try {
          // 存储课程计划数据到localStorage，以便路由页面可以获取
          const coursePlanData = response.data?.data || response.data;
          
          // 确保数据符合预期格式
          if (coursePlanData && (coursePlanData.coursePlanItems || coursePlanData.data?.coursePlanItems)) {
            // 规范化数据结构
            const normalizedData = {
              coursePlanItems: coursePlanData.coursePlanItems || coursePlanData.data?.coursePlanItems || [],
              coursePlanSummary: coursePlanData.coursePlanSummary || coursePlanData.data?.coursePlanSummary || {
                title: '自动生成的研学方案',
                description: '根据您的需求生成的方案',
                totalDuration: '未指定'
              }
            };
            
            localStorage.setItem('currentCoursePlan', JSON.stringify(normalizedData));
            console.log('已将规范化课程计划数据存储到localStorage:', normalizedData);
          } else {
            localStorage.setItem('currentCoursePlan', JSON.stringify(coursePlanData));
            console.log('已将原始课程计划数据存储到localStorage');
          }
        } catch (storageError) {
          console.error('存储课程计划数据失败:', storageError);
        }
        
        // 导航到路线页面
        setTimeout(() => {
          navigate('/routes');
        }, 1000);
      }
      
    } catch (err: any) {
      console.error('处理提示词错误:', err);
      message.error('生成研学方案失败');
      setError(err.message || '未知错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理澄清回答
  const handleClarificationSubmit = (key: string, response: string) => {
    // 保存澄清回答
    setClarificationResponses({
      ...clarificationResponses,
      [key]: response
    });

    // 关闭对话框
    setIsModalVisible(false);

    // 更新提示词并继续处理
    const enhancedPrompt = `${inputText}（${currentQuestion?.question}：${response}）`;
    setInputText(enhancedPrompt);
    
    // 使用增强后的提示词进行处理
    processPrompt(enhancedPrompt);
  };

  return (
    <div className="page-container">
      <Title level={2}>教学要求输入</Title>
      <Paragraph className="info-paragraph">
        请输入您的教学要求提示词，包含<span className="highlight-text">主题</span>、<span className="highlight-text">目标</span>、<span className="highlight-text">学生信息</span>、<span className="highlight-text">时长</span>、<span className="highlight-text">预算</span>等信息。系统将基于您的输入生成研学方案。
      </Paragraph>

      <InputForm 
        onSubmit={handlePromptSubmit} 
        disabled={isLoading} 
        examplePrompts={EXAMPLE_PROMPTS}
      />

      {submittedPrompt && (
        <Card title="已提交的提示词" className="submitted-prompt-card">
          <Paragraph>{submittedPrompt}</Paragraph>
          <Divider />
          
          {isLoading || (studyPlanStatus && studyPlanStatus.status !== 'completed' && studyPlanStatus.status !== 'failed') ? (
            <div className="loading-container">
              <Spin />
              <Paragraph type="secondary" style={{ marginTop: 16 }}>
                {studyPlanStatus ? 
                  `系统正在生成研学方案 (${Math.round(studyPlanStatus.progress * 100)}%)...` : 
                  '系统正在处理您的请求...'
                }
              </Paragraph>
            </div>
          ) : error ? (
            <div className="error-container">
              <Paragraph type="danger">{error}</Paragraph>
              <Paragraph type="secondary">请修改提示词后重新提交，或联系管理员获取帮助。</Paragraph>
            </div>
          ) : studyPlanStatus?.status === 'completed' ? (
            <div className="success-container">
              <Paragraph type="success">研学方案生成成功！</Paragraph>
              <Paragraph type="secondary">正在跳转到方案详情页...</Paragraph>
            </div>
          ) : (
            <Paragraph type="secondary">
              系统正在准备生成研学方案，请稍候...
            </Paragraph>
          )}
        </Card>
      )}

      <ClarifyDialog
        visible={isModalVisible}
        currentQuestion={currentQuestion}
        onSubmit={handleClarificationSubmit}
        onCancel={() => setIsModalVisible(false)}
      />
    </div>
  );
};

export default TeacherInputPage;
