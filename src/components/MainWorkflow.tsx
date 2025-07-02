import React, { useState, useEffect } from 'react';
import { Steps, Card, Modal, Button, message } from 'antd';
import {   EditOutlined,   EnvironmentOutlined,   BulbOutlined,   CarOutlined,   BookOutlined,  ArrowRightOutlined} from '@ant-design/icons';
import { useWorkflow } from './WorkflowContext';
import TeacherInputStep from './WorkflowSteps/TeacherInputStep';import LandmarksStep from './WorkflowSteps/LandmarksStep';import PlanGeneratorStep from './WorkflowSteps/PlanGeneratorStep';import RouteStep from './WorkflowSteps/RouteStep';import NotesStep from './WorkflowSteps/NotesStep';
import './MainWorkflow.css';
import { useNavigate } from 'react-router-dom';

const { Step } = Steps;

const MainWorkflow: React.FC = () => {
  const { 
    currentStep, 
    setCurrentStep, 
    workflowData, 
    setIsInWorkflow,
    nextStep 
  } = useWorkflow();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const steps = [    {      title: '教学要求',      icon: <EditOutlined />,      description: '输入教学要求提示词',      component: TeacherInputStep    },    {      title: '景点选择',      icon: <EnvironmentOutlined />,      description: '选择合适的研学景点',      component: LandmarksStep    },    {      title: '课程规划',      icon: <BulbOutlined />,      description: '生成课程计划方案',      component: PlanGeneratorStep    },    {      title: '路线设计',      icon: <CarOutlined />,      description: '设计最优研学路线',      component: RouteStep    },    {      title: '艺术笔记',      icon: <BookOutlined />,      description: '创建学习笔记模板',      component: NotesStep    }  ];

  const navigate = useNavigate();

  // 监听工作流步骤变化
  useEffect(() => {
    if (currentStep > 0 && currentStep < steps.length) {
      setIsModalVisible(true);
      setModalContent(React.createElement(steps[currentStep].component));
    }
  }, [currentStep]);

  // 处理步骤完成的回调
  const handleStepComplete = (stepIndex: number, data: any) => {
    // 模拟AI处理过程
    setIsProcessing(true);
    setIsModalVisible(false);
    
    setTimeout(() => {
      setIsProcessing(false);
      
      if (stepIndex < steps.length - 1) {
        message.success(`${steps[stepIndex].title}完成！正在进入下一步...`);
        setTimeout(() => {
          nextStep();
        }, 1000);
      } else {
        message.success('所有流程已完成！研学方案已生成。');
      }
    }, 2000);
  };

  // 开始工作流
  const startWorkflow = () => {
    setIsInWorkflow(true);
    setCurrentStep(0);
    setIsModalVisible(true);
    setModalContent(React.createElement(steps[0].component));
  };

  // 跳转到指定步骤
  const goToStep = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      setIsModalVisible(true);
      setModalContent(React.createElement(steps[stepIndex].component));
    }
  };

  return (
    <div className="workflow-container">
      <div className="workflow-header">
        <h1 className="workflow-title">
          智能研学助手
          <span className="workflow-subtitle">AI-Powered Study Tour Assistant</span>
        </h1>
        <p className="workflow-description">
          基于人工智能的智能研学方案设计平台，为您提供从需求分析到方案实施的全流程服务
        </p>
      </div>

      <Card className="workflow-steps-card">
        <Steps 
          current={currentStep} 
          className="workflow-steps"
          size="small"
        >
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
              onClick={() => goToStep(index)}
              className={index <= currentStep ? 'step-clickable' : 'step-disabled'}
            />
          ))}
        </Steps>
      </Card>

      <div className="workflow-content">
        {currentStep === 0 && !isModalVisible && (
          <Card className="welcome-card">
            <div className="welcome-content">
              <div className="welcome-icon">
                <EditOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </div>
              <h2>开始您的研学之旅</h2>
              <p>请点击下方按钮，输入您的教学要求，我们的AI助手将为您生成完整的研学方案。</p>
              <Button 
                type="primary" 
                size="large" 
                onClick={startWorkflow}
                className="start-button"
                icon={<ArrowRightOutlined />}
              >
                开始设计研学方案
              </Button>
            </div>
          </Card>
        )}

        {isProcessing && (
          <Card className="processing-card">
            <div className="processing-content">
              <div className="processing-animation">
                <div className="ai-thinking"></div>
              </div>
              <h3>AI正在处理中...</h3>
              <p>请稍候，我们的智能系统正在为您生成最佳方案</p>
            </div>
          </Card>
        )}

        {currentStep >= steps.length && (
          <Card className="completion-card">
            <div className="completion-content">
              <div className="completion-icon">
                <BookOutlined style={{ fontSize: 48, color: '#52c41a' }} />
              </div>
              <h2>恭喜！研学方案已完成</h2>
              <p>您的智能研学方案已经生成完毕，包含了完整的教学设计、路线规划和学习资源。</p>
              <div className="completion-actions">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => window.print()}
                  style={{ marginRight: 16 }}
                >
                  打印方案
                </Button>
                <Button 
                  size="large"
                  onClick={() => {
                    setCurrentStep(0);
                    setIsInWorkflow(false);
                  }}
                >
                  重新开始
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Modal
        title={
          <div className="modal-title">
            {steps[currentStep]?.icon}
            <span style={{ marginLeft: 8 }}>{steps[currentStep]?.title}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
        className="workflow-modal"
        destroyOnHidden={true}
      >
        <div className="modal-content">
          {modalContent}
        </div>
      </Modal>
    </div>
  );
};

export default MainWorkflow; 