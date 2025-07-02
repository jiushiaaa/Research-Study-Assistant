import React, { useState } from 'react';
import { Steps, Form, Input, Select, Button, message, Checkbox, Card, Space } from 'antd';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

interface Landmark {
  id: string;
  title: string;
  type: string;
  duration: string;
}

const LANDMARKS: Landmark[] = [
  { id: '1', title: '多伦路文化名人街', type: '历史文化', duration: '约1-2小时' },
  { id: '2', title: '鲁迅公园与墓', type: '人文景观', duration: '约2小时' },
  { id: '3', title: '1933老场坊', type: '工业遗址', duration: '约3小时' },
  { id: '4', title: '上海犹太难民纪念馆', type: '历史文化', duration: '约1小时' },
  { id: '5', title: '虹口足球场', type: '体育场馆', duration: '约1.5小时' },
];

const PlanGeneratorPage: React.FC = () => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [basicInfo, setBasicInfo] = useState<any>(null);
  const [selectedLandmarks, setSelectedLandmarks] = useState<string[]>([]);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);

  const handleNextStep = async () => {
    try {
      if (currentStep === 0) {
        const values = await form.validateFields();
        setBasicInfo(values);
        setCurrentStep(1);
      } else if (currentStep === 1) {
        if (selectedLandmarks.length === 0) {
          message.error('请至少选择一个景点');
          return;
        }
        setCurrentStep(2);
        generatePlan();
      }
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleLandmarkSelection = (landmarkId: string, checked: boolean) => {
    if (checked) {
      setSelectedLandmarks([...selectedLandmarks, landmarkId]);
    } else {
      setSelectedLandmarks(selectedLandmarks.filter(id => id !== landmarkId));
    }
  };

  const generatePlan = () => {
    // Simulate plan generation
    setTimeout(() => {
      const selectedLandmarkDetails = LANDMARKS.filter(landmark => 
        selectedLandmarks.includes(landmark.id)
      );
      
      setGeneratedPlan({
        title: basicInfo.title,
        grade: basicInfo.grade,
        duration: basicInfo.duration,
        objective: basicInfo.objective,
        landmarks: selectedLandmarkDetails,
        schedule: [
          { time: '08:30-09:00', activity: '集合点名，安全教育' },
          { time: '09:00-10:30', activity: `参观${selectedLandmarkDetails[0]?.title || '景点1'}` },
          { time: '10:30-11:00', activity: '小组讨论与笔记整理' },
          { time: '11:00-12:00', activity: '午餐时间' },
          { time: '12:00-13:30', activity: `参观${selectedLandmarkDetails[1]?.title || '景点2'}` },
          { time: '13:30-14:30', activity: '研学活动与实践任务' },
          { time: '14:30-15:30', activity: '总结与分享' },
          { time: '15:30-16:00', activity: '返程' },
        ]
      });
      
      message.success('研学计划生成成功');
    }, 1500);
  };

  const renderStepOne = () => {
    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          title: '虹口区人文历史探索之旅',
          grade: '初中一年级',
          duration: '1天',
          objective: '探索虹口区的人文历史景观，了解上海近代文化发展，培养学生的历史意识和人文素养。'
        }}
      >
        <Form.Item
          label="研学项目标题"
          name="title"
          rules={[{ required: true, message: '请输入研学项目标题' }]}
        >
          <Input className="login-input" />
        </Form.Item>
        
        <Form.Item
          label="适用年级"
          name="grade"
          rules={[{ required: true, message: '请选择适用年级' }]}
        >
          <Select className="login-input">
            <Option value="小学三年级">小学三年级</Option>
            <Option value="小学四年级">小学四年级</Option>
            <Option value="小学五年级">小学五年级</Option>
            <Option value="小学六年级">小学六年级</Option>
            <Option value="初中一年级">初中一年级</Option>
            <Option value="初中二年级">初中二年级</Option>
            <Option value="初中三年级">初中三年级</Option>
            <Option value="高中一年级">高中一年级</Option>
            <Option value="高中二年级">高中二年级</Option>
            <Option value="高中三年级">高中三年级</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          label="研学时长"
          name="duration"
          rules={[{ required: true, message: '请选择研学时长' }]}
        >
          <Select className="login-input">
            <Option value="半天">半天</Option>
            <Option value="1天">1天</Option>
            <Option value="2天">2天</Option>
            <Option value="3天">3天</Option>
          </Select>
        </Form.Item>
        
        <Form.Item
          label="研学目标"
          name="objective"
          rules={[{ required: true, message: '请输入研学目标' }]}
        >
          <TextArea className="login-input" rows={4} />
        </Form.Item>
        
        <Form.Item style={{ textAlign: 'right', marginTop: 24 }}>
          <Button type="primary" onClick={handleNextStep}>
            下一步
          </Button>
        </Form.Item>
      </Form>
    );
  };

  const renderStepTwo = () => {
    return (
      <div>
        <h3>选择研学景点</h3>
        <p>请从下列景点中选择要包含在研学计划中的景点：</p>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          {LANDMARKS.map(landmark => (
            <Card key={landmark.id} style={{ marginBottom: 12 }}>
              <Checkbox
                onChange={(e) => handleLandmarkSelection(landmark.id, e.target.checked)}
                checked={selectedLandmarks.includes(landmark.id)}
              >
                <div style={{ marginLeft: 8 }}>
                  <h4 style={{ margin: 0 }}>{landmark.title}</h4>
                  <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                    类型: {landmark.type} | 游览时间: {landmark.duration}
                  </p>
                </div>
              </Checkbox>
            </Card>
          ))}
        </Space>
        
        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Button style={{ marginRight: 12 }} onClick={handlePrevStep}>
            上一步
          </Button>
          <Button type="primary" onClick={handleNextStep}>
            生成计划
          </Button>
        </div>
      </div>
    );
  };

  const renderStepThree = () => {
    if (!generatedPlan) {
      return (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <p>正在生成研学计划，请稍候...</p>
        </div>
      );
    }

    return (
      <div>
        <h3>{generatedPlan.title}</h3>
        
        <div style={{ marginBottom: 24 }}>
          <p><strong>适用年级:</strong> {generatedPlan.grade}</p>
          <p><strong>研学时长:</strong> {generatedPlan.duration}</p>
          <p><strong>研学目标:</strong> {generatedPlan.objective}</p>
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <h4>研学景点</h4>
          <ul>
            {generatedPlan.landmarks.map((landmark: Landmark) => (
              <li key={landmark.id}>
                {landmark.title} ({landmark.type}, {landmark.duration})
              </li>
            ))}
          </ul>
        </div>
        
        <div style={{ marginBottom: 24 }}>
          <h4>研学日程安排</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #eee', padding: 8, textAlign: 'left' }}>时间</th>
                <th style={{ border: '1px solid #eee', padding: 8, textAlign: 'left' }}>活动内容</th>
              </tr>
            </thead>
            <tbody>
              {generatedPlan.schedule.map((item: any, index: number) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #eee', padding: 8 }}>{item.time}</td>
                  <td style={{ border: '1px solid #eee', padding: 8 }}>{item.activity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Button style={{ marginRight: 12 }} onClick={handlePrevStep}>
            修改选择
          </Button>
          <Button type="primary">
            导出计划
          </Button>
        </div>
      </div>
    );
  };

  const steps = [
    { title: '基本信息', content: renderStepOne() },
    { title: '景点选择', content: renderStepTwo() },
    { title: '计划生成', content: renderStepThree() }
  ];

  return (
    <div className="page-container">
      <h2>研学计划生成器</h2>
      
      <div style={{ background: 'white', padding: 24, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.09)' }}>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map(item => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>
        
        {steps[currentStep].content}
      </div>
    </div>
  );
};

export default PlanGeneratorPage; 