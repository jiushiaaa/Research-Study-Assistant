import React, { useState } from 'react';
import { Card, Button, Typography, Space, Alert, Spin } from 'antd';

const { Title, Text, Paragraph } = Typography;

const BackendTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // 测试后端健康状态
  const testBackendHealth = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      console.log('🔍 测试后端服务器健康状态...');
      
      const response = await fetch('http://localhost:8080/health');
      const data = await response.json();
      
      if (response.ok) {
        setResult(`✅ 后端服务器运行正常！\n\n响应数据：\n${JSON.stringify(data, null, 2)}`);
      } else {
        setError(`❌ 后端服务器响应异常：${response.status}`);
      }
    } catch (err: any) {
      console.error('❌ 后端健康检查失败:', err);
      setError(`❌ 无法连接后端服务器：${err.message}\n\n请确保后端服务器已启动！`);
    } finally {
      setLoading(false);
    }
  };

  // 测试通过后端调用AI
  const testBackendAi = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      console.log('🤖 通过后端测试AI调用...');
      
      const response = await fetch('http://localhost:8080/api/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "ernie-4.5-turbo-128k",
          messages: [
            {
              role: "user",
              content: "你好！请简单介绍一下你自己，并说明你现在可以为我提供什么帮助。"
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        const aiResponse = data.choices?.[0]?.message?.content || '未获取到AI回复';
        setResult(`🎉 AI调用成功！\n\n🤖 AI回复：\n${aiResponse}\n\n📊 使用统计：\n${JSON.stringify(data.usage || {}, null, 2)}`);
      } else {
        setError(`❌ AI调用失败：${data.error || data.details || '未知错误'}`);
      }
    } catch (err: any) {
      console.error('❌ 后端AI调用失败:', err);
      setError(`❌ 调用失败：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🔧 后端代理API测试</Title>
      
      <Alert
        message="解决方案说明"
        description="现在使用百度千帆平台API，这是百度的企业级AI服务平台。我们创建了一个Node.js后端服务器来代理API调用，避免CORS问题。"
        type="info"
        showIcon
        style={{ marginBottom: '20px' }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* 后端状态检查 */}
        <Card title="🏥 后端服务器状态检查" size="small">
          <Paragraph>
            <Text strong>说明：</Text>首先检查后端服务器是否正常运行
          </Paragraph>
          <Button 
            type="primary" 
            onClick={testBackendHealth}
            loading={loading}
            icon={<span>🔍</span>}
          >
            检查后端状态
          </Button>
        </Card>

        {/* AI功能测试 */}
        <Card title="🤖 AI功能测试" size="small">
          <Paragraph>
            <Text strong>说明：</Text>通过后端代理调用百度千帆平台API
          </Paragraph>
          <Button 
            type="primary" 
            onClick={testBackendAi}
            loading={loading}
            icon={<span>🧪</span>}
          >
            测试AI对话
          </Button>
        </Card>

        {/* 启动说明 */}
        <Card title="🚀 后端服务器启动说明" size="small">
          <Paragraph>
            <Text strong>如果后端未启动，请执行以下命令：</Text>
          </Paragraph>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`# 安装依赖（如果还没安装）
npm install express cors dotenv openai

# 启动后端服务器
node server.js`}
          </pre>
          <Paragraph>
            <Text type="secondary">后端服务器将运行在 http://localhost:8080</Text>
          </Paragraph>
        </Card>

        {/* 结果显示 */}
        {loading && (
          <Card>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
              <div style={{ marginTop: '10px' }}>处理中...</div>
            </div>
          </Card>
        )}

        {error && (
          <Alert
            message="测试失败"
            description={<pre style={{ whiteSpace: 'pre-wrap' }}>{error}</pre>}
            type="error"
            showIcon
          />
        )}

        {result && (
          <Alert
            message="测试成功"
            description={<pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>}
            type="success"
            showIcon
          />
        )}

      </Space>
    </div>
  );
};

export default BackendTestPage; 