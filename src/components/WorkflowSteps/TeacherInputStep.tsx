import React, { useState } from 'react';
import { Card, Button, Input, Form, message, Progress, Alert } from 'antd';
import { ArrowRightOutlined, LoadingOutlined } from '@ant-design/icons';
import { useWorkflow } from '../WorkflowContext';
import { studyPlanApi, CreateStudyPlanRequest } from '../../services/apiService';

const { TextArea } = Input;

const EXAMPLE_PROMPTS = [
    "出发地点为虹口区霍山路小学，小学五年级学生，设计半天虹口红色文化研学",
    "出发地点为虹口区实验学校，初二学生，探索虹口区石库门建筑，侧重艺术特色",
    "出发地点为上外附中，高中学生，虹口工业遗迹研学，包含1933老场坊，注重历史与现代转型",
    "出发地点为复兴高级中学，高中学生，多伦路文化名人街研学，文学主题，公共交通"
];

const TeacherInputStep: React.FC = () => {
  const { nextStep, updateWorkflowData, setError, error } = useWorkflow();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      setProgress(0);
      setError(null);
      setStatusMessage('正在提交教学要求...');

      // 构建请求数据
      const request: CreateStudyPlanRequest = {
        prompt: values.prompt,
        // 可以根据需要添加其他可选参数
        estimatedDurationMinutes: 480, // 默认8小时
        studentCount: 30, // 默认30人
      };

      setProgress(20);
      setStatusMessage('正在调用AI分析教学需求...');

      // 调用后端API创建研学方案
      const response = await studyPlanApi.createStudyPlan(request);
      
      setProgress(40);
      setStatusMessage('正在生成课程方案...');

      // 更新工作流数据
      updateWorkflowData({
        teacherPrompt: values.prompt,
        studyPlanGenerationId: response.studyPlanGenerationId
      });

      setProgress(60);
      setStatusMessage('正在等待AI处理完成...');

      // 等待处理完成
      const finalResult = await studyPlanApi.waitForCompletion(response.studyPlanGenerationId);
      
      if (finalResult.status === 'failed') {
        throw new Error(finalResult.llmErrorMessage || '处理失败');
      }

      setProgress(100);
      setStatusMessage('方案生成完成！');

      // 保存完整的方案数据
      updateWorkflowData({
        fullStudyPlan: finalResult
      });

      message.success('教学要求已处理完成，AI已生成初步方案！');
      
      // 进入下一步
      setTimeout(() => {
        nextStep();
      }, 1000);
      
    } catch (error: any) {
      console.error('提交教学要求失败:', error);
      const errorMessage = error.message || '提交失败，请重试';
      setError(errorMessage);
      message.error(errorMessage);
      setProgress(0);
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const insertExample = (example: string) => {
    form.setFieldsValue({ prompt: example });
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <Card 
        title="输入教学要求" 
        className="workflow-step-card"
        variant="outlined"
      >
        {error && (
          <Alert
            message="处理错误"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        {isLoading && (
          <Card 
            style={{ marginBottom: 20, background: '#f6f8fa' }}
            variant="outlined"
          >
            <div style={{ textAlign: 'center' }}>
              <LoadingOutlined style={{ fontSize: 24, color: '#1890ff', marginBottom: 16 }} />
              <h3>AI正在处理您的教学要求</h3>
              <p style={{ color: '#666', marginBottom: 16 }}>{statusMessage}</p>
              <Progress 
                percent={progress} 
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
                style={{ maxWidth: 400, margin: '0 auto' }}
              />
            </div>
          </Card>
        )}

        <Form 
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={isLoading}
        >
          <Form.Item
            label="教学要求提示词"
            name="prompt"
            rules={[
              { required: true, message: '请输入教学要求' },
              { min: 10, message: '请输入至少10个字符的详细要求' }
            ]}
            extra="请详细描述您的教学目标、学生信息、时长、预算等要求，AI将据此生成专业的研学方案"
          >
            <TextArea
              rows={6}
              placeholder="例如：为五年级学生设计半天虹口红色文化研学，预算≤50元/人，重点了解鲁迅文化和左翼文学运动历史..."
              style={{ fontSize: '16px' }}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <div style={{ marginBottom: 20 }}>
            <p style={{ marginBottom: 12, fontWeight: 500, color: '#1890ff' }}>💡 示例提示词（点击插入）：</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EXAMPLE_PROMPTS.map((example, index) => (
                <Button
                  key={index}
                  type="dashed"
                  size="small"
                  onClick={() => insertExample(example)}
                  disabled={isLoading}
                  style={{ 
                    textAlign: 'left', 
                    height: 'auto', 
                    padding: '8px 12px',
                    whiteSpace: 'normal'
                  }}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #bae7ff', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 20 
          }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#1890ff' }}>💡 提示词建议包含以下信息：</h4>
            <ul style={{ margin: 0, color: '#666' }}>
              <li>目标学生：年级、人数</li>
              <li>研学主题：文化、历史、艺术等</li>
              <li>时间安排：半天、一天、两天</li>
              <li>预算要求：人均预算范围</li>
              <li>特殊需求：交通方式、安全要求等</li>
            </ul>
          </div>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isLoading}
              size="large"
              icon={!isLoading && <ArrowRightOutlined />}
              style={{
                borderRadius: '20px',
                padding: '0 30px',
                height: '45px',
                fontSize: '16px',
                fontWeight: 600
              }}
            >
              {isLoading ? '正在生成方案...' : '🚀 生成智能研学方案'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TeacherInputStep; 