import React, { useState } from 'react';
import { Button, Card, Space, Typography, message } from 'antd';
import { AudioOutlined, MessageOutlined, RobotOutlined } from '@ant-design/icons';
import { AiChatDialog } from '../components/AiChat';
import { deepSeekAiService } from '../services/baiduAiService';
import { speechService } from '../services/speechService';

const { Title, Paragraph, Text } = Typography;

const AiTestPage: React.FC = () => {
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatLocation, setChatLocation] = useState('');
  const [chatQuestion, setChatQuestion] = useState('');
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 测试DeepSeek AI API
  const testDeepSeekApi = async () => {
    setIsLoading(true);
    setTestResult('');
    
    try {
      const response = await deepSeekAiService.askQuestion('你好，请简单介绍一下自己');
      setTestResult(`✅ API测试成功！\n回复: ${response}`);
      message.success('DeepSeek AI API连接成功！');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      setTestResult(`❌ API测试失败！\n错误: ${errorMsg}`);
      message.error('DeepSeek AI API连接失败！');
    } finally {
      setIsLoading(false);
    }
  };

  // 测试语音识别
  const testSpeechRecognition = async () => {
    if (!speechService.getIsSupported()) {
      message.error('当前浏览器不支持语音识别功能');
      return;
    }

    try {
      message.info('开始语音识别测试，请说话...');
      const result = await speechService.recognizeOnce();
      setTestResult(`✅ 语音识别成功！\n识别结果: ${result}`);
      message.success('语音识别测试成功！');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误';
      setTestResult(`❌ 语音识别失败！\n错误: ${errorMsg}`);
      message.error('语音识别测试失败！');
    }
  };

  // 打开通用AI对话
  const openGeneralChat = () => {
    setChatLocation('');
    setChatQuestion('');
    setShowAiChat(true);
  };

  // 打开景点相关对话
  const openLocationChat = () => {
    setChatLocation('上海鲁迅纪念馆');
    setChatQuestion('请介绍一下这个地方的历史文化意义');
    setShowAiChat(true);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>
        <RobotOutlined /> AI功能测试页面
      </Title>
      
      <Paragraph>
        这个页面用于测试 DeepSeek 大模型API 和语音识别功能的集成效果。
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* API测试卡片 */}
        <Card title="🔗 DeepSeek AI API测试" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>
              测试与 DeepSeek 大模型的连接是否正常。
            </Paragraph>
            <Button 
              type="primary" 
              onClick={testDeepSeekApi}
              loading={isLoading}
              icon={<MessageOutlined />}
            >
              测试API连接
            </Button>
          </Space>
        </Card>

        {/* 语音识别测试卡片 */}
        <Card title="🎤 语音识别测试" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>
              测试浏览器的语音识别功能是否可用。
            </Paragraph>
            <Button 
              type="primary" 
              onClick={testSpeechRecognition}
              icon={<AudioOutlined />}
              disabled={!speechService.getIsSupported()}
            >
              {speechService.getIsSupported() ? '测试语音识别' : '浏览器不支持语音识别'}
            </Button>
          </Space>
        </Card>

        {/* 对话测试卡片 */}
        <Card title="💬 AI对话测试" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>
              测试完整的AI对话功能，包括语音输入和文字输入。
            </Paragraph>
            <Space>
              <Button 
                type="primary" 
                onClick={openGeneralChat}
                icon={<MessageOutlined />}
              >
                通用AI对话
              </Button>
              <Button 
                onClick={openLocationChat}
                icon={<MessageOutlined />}
              >
                景点介绍对话
              </Button>
            </Space>
          </Space>
        </Card>

        {/* 测试结果显示 */}
        {testResult && (
          <Card title="📋 测试结果" size="small">
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '12px', 
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {testResult}
            </pre>
          </Card>
        )}

        {/* 使用说明 */}
        <Card title="📖 使用说明" size="small">
          <Space direction="vertical">
            <Text strong>API配置信息：</Text>
            <Text code>API Key: sk-e580e4d0d96d43e3a98244fbc232419e</Text>
            <Text code>Base URL: https://api.deepseek.com/v1</Text>
            <Text code>默认模型: deepseek-chat</Text>
            <Text strong>功能特性：</Text>
            <ul>
              <li>✅ 支持流式响应，实时显示AI回复</li>
              <li>✅ 支持语音输入和文字输入</li>
              <li>✅ 支持多轮对话，保持上下文</li>
              <li>✅ 支持景点特定的智能问答</li>
              <li>✅ 响应式设计，适配移动端</li>
            </ul>
            <Text strong>访问地址：</Text>
            <ul>
              <li><Text code>http://localhost:3000/</Text> - 主页面</li>
              <li><Text code>http://localhost:3000/ai-test</Text> - AI测试页面</li>
            </ul>
          </Space>
        </Card>
      </Space>

      {/* AI对话框 */}
      <AiChatDialog
        visible={showAiChat}
        onClose={() => setShowAiChat(false)}
        locationName={chatLocation}
        initialQuestion={chatQuestion}
      />
    </div>
  );
};

export default AiTestPage; 