import React, { useState } from 'react';
import { Modal, Radio, Input, Space, Typography, message } from 'antd';

const { Paragraph } = Typography;

interface ClarificationQuestion {
  key: string;
  question: string;
  options: string[];
}

interface ClarifyDialogProps {
  visible: boolean;
  currentQuestion: ClarificationQuestion | null;
  onSubmit: (key: string, response: string) => void;
  onCancel: () => void;
}

const ClarifyDialog: React.FC<ClarifyDialogProps> = ({
  visible,
  currentQuestion,
  onSubmit,
  onCancel
}) => {
  const [radioValue, setRadioValue] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  // 处理单选按钮变化
  const handleRadioChange = (e: any) => {
    const value = e.target.value;
    setRadioValue(value);
    setIsOtherSelected(value === '其他');
  };

  // 处理提交
  const handleSubmit = () => {
    if (!currentQuestion) return;
    
    let response = radioValue;
    if (isOtherSelected && textInput) {
      response = textInput;
    }
    
    if (!response) {
      message.warning('请选择或输入回答');
      return;
    }

    onSubmit(currentQuestion.key, response);
    
    // 重置表单状态
    setRadioValue('');
    setTextInput('');
    setIsOtherSelected(false);
  };

  return (
    <Modal
      title="需要更多信息"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      okText="确认"
      cancelText="取消"
      afterClose={() => {
        setRadioValue('');
        setTextInput('');
        setIsOtherSelected(false);
      }}
    >
      {currentQuestion && (
        <>
          <Paragraph>{currentQuestion.question}</Paragraph>
          <Radio.Group onChange={handleRadioChange} value={radioValue}>
            <Space direction="vertical">
              {currentQuestion.options.map((option) => (
                <Radio key={option} value={option}>
                  {option}
                </Radio>
              ))}
              <Radio value="其他">其他</Radio>
            </Space>
          </Radio.Group>
          
          {isOtherSelected && (
            <Input 
              placeholder="请输入" 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              style={{ marginTop: 16 }}
            />
          )}
        </>
      )}
    </Modal>
  );
};

export default ClarifyDialog; 