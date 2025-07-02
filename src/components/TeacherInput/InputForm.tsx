import React, { useState } from 'react';
import { 
  Input, 
  Button, 
  Card, 
  Space, 
  Typography, 
  message 
} from 'antd';
import { SendOutlined, QuestionCircleOutlined, FormOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface InputFormProps {
  onSubmit: (text: string) => void;
  disabled?: boolean; // 添加 disabled 属性
  examplePrompts?: string[]; // 添加外部可传递的示例提示词
}

const InputForm: React.FC<InputFormProps> = ({ 
  onSubmit, 
  disabled = false, 
  examplePrompts = [
    "出发地点为虹口区霍山路小学，小学五年级学生，设计半天虹口红色文化研学",
    "出发地点为虹口区实验学校，初二学生，探索虹口区石库门建筑，侧重艺术特色",
    "出发地点为上外附中，高中学生，虹口工业遗迹研学，包含1933老场坊，注重历史与现代转型",
    "出发地点为复兴高级中学，高中学生，多伦路文化名人街研学，文学主题，公共交通"
  ] // 默认示例提示词
}) => {
  const [inputText, setInputText] = useState('');

  // 处理文本输入变化
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // 提交提示词
  const handleSubmit = () => {
    if (!inputText.trim()) {
      message.warning('请输入教学要求提示词');
      return;
    }
    onSubmit(inputText);
  };

  // 使用示例提示词
  const applyExamplePrompt = (example: string) => {
    setInputText(example);
  };

  const showHelpInfo = () => {
    message.info(
      <div>
        <p>有效的提示词应包含以下信息：</p>
        <ul>
          <li>学生年级：如 "五年级"、"初中一年级"</li>
          <li>研学时长：如 "半天"、"1天"、"2小时"</li>
          <li>研学主题：如 "红色文化"、"石库门建筑"</li>
          <li>可选信息：预算、交通方式、特殊需求等</li>
        </ul>
      </div>
    );
  };

  return (
    <>
      <Card title="提示词输入" className="prompt-card">
        <TextArea
          value={inputText}
          onChange={handleTextChange}
          placeholder="例如：为五年级学生设计半天虹口红色文化研学"
          autoSize={{ minRows: 4, maxRows: 8 }}
          maxLength={500}
          showCount
          style={{ marginBottom: 16 }}
          disabled={disabled} // 添加 disabled 属性
        />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            onClick={handleSubmit}
            disabled={disabled} // 添加 disabled 属性
            loading={disabled} // 如果禁用，显示加载状态
          >
            {disabled ? '处理中...' : '提交'}
          </Button>
          
          <Button 
            type="link" 
            icon={<QuestionCircleOutlined />} 
            onClick={showHelpInfo}
            disabled={disabled} // 添加 disabled 属性
          >
            如何编写有效提示词？
          </Button>
        </div>
      </Card>

      <Card title="示例提示词" className="prompt-card">
        <Space direction="vertical" style={{ width: '100%' }}>
          {examplePrompts.map((example, index) => (
            <div key={index} className="example-item">
              <Text>{example}</Text>
              <Button 
                type="link" 
                icon={<FormOutlined />} 
                onClick={() => applyExamplePrompt(example)}
                disabled={disabled} // 添加 disabled 属性
              >
                使用
              </Button>
            </div>
          ))}
        </Space>
      </Card>
    </>
  );
};

export default InputForm;