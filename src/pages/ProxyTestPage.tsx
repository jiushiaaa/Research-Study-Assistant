import React, { useState } from 'react';
import { Button, Card, Typography, message, Space } from 'antd';
import { ApiOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ProxyTestPage: React.FC = () => {
  const [testResult, setTestResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testDirectAPI = async () => {
    setIsLoading(true);
    setTestResult('正在测试直接API调用...');
    
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-e580e4d0d96d43e3a98244fbc232419e', // 请替换为你的DeepSeek API Key
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: 'user', content: '你好' }],
          stream: false,
          temperature: 0.95,
          max_tokens: 100
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ DeepSeek 直接API调用成功！\n回复: ${data.choices[0]?.message?.content || '无回复'}`);
      } else {
        setTestResult(`❌ DeepSeek 直接API调用失败！\n状态码: ${response.status}\n错误: ${response.statusText}`);
      }
    } catch (error) {
      setTestResult(`❌ DeepSeek 直接API调用失败！\n错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testProxyAPI = async () => {
    setIsLoading(true);
    setTestResult('正在测试代理API调用...');
    
    try {
      const response = await fetch('/api/baidu/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'sk-e580e4d0d96d43e3a98244fbc232419e',
        },
        body: JSON.stringify({
          model: "deepseek-r1",
          messages: [{ role: 'user', content: '你好，请简单介绍一下自己' }],
          stream: false,
          temperature: 0.95,
          max_completion_tokens: 100
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ 代理API调用成功！\n回复: ${data.choices[0]?.message?.content || '无回复'}`);
        message.success('代理API测试成功！');
      } else {
        const errorText = await response.text();
        setTestResult(`❌ 代理API调用失败！\n状态码: ${response.status}\n错误: ${errorText}`);
        message.error('代理API测试失败！');
      }
    } catch (error) {
      setTestResult(`❌ 代理API调用失败！\n错误: ${error instanceof Error ? error.message : '未知错误'}`);
      message.error('代理API测试失败！');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>
        <ApiOutlined /> API代理测试页面
      </Title>
      
      <Paragraph>
        这个页面用于测试百度API的直接调用和代理调用，帮助诊断CORS问题。
      </Paragraph>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="🔗 API连接测试" size="small">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>
              测试不同的API调用方式，帮助确定CORS问题的解决方案。
            </Paragraph>
            <Space>
              <Button 
                type="primary" 
                onClick={testProxyAPI}
                loading={isLoading}
                icon={<ApiOutlined />}
              >
                测试代理API (推荐)
              </Button>
              <Button 
                onClick={testDirectAPI}
                loading={isLoading}
                icon={<ApiOutlined />}
              >
                测试直接API (会失败)
              </Button>
            </Space>
          </Space>
        </Card>

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

        <Card title="📖 说明" size="small">
          <Space direction="vertical">
            <Text strong>代理配置:</Text>
            <Text code>/api/baidu/* → https://aistudio.baidu.com/llm/lmapi/v3/*</Text>
            
            <Text strong>CORS问题解决方案:</Text>
            <ul>
              <li>✅ 开发环境: 使用webpack代理 (setupProxy.js)</li>
              <li>⚠️ 生产环境: 需要配置服务器代理或CORS头</li>
            </ul>

            <Text strong>代理工作原理:</Text>
            <ol>
              <li>前端请求 /api/baidu/chat/completions</li>
              <li>webpack代理转发到 https://aistudio.baidu.com/llm/lmapi/v3/chat/completions</li>
              <li>代理服务器添加必要的CORS头</li>
              <li>返回响应给前端</li>
            </ol>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default ProxyTestPage; 