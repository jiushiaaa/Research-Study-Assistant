import React, { useState } from 'react';
import { Card, Button, Input, Typography, Alert, Spin, Space, Divider } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ApiTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  // DeepSeek API Key（请替换为你的真实API Key）
  const DEEPSEEK_API_KEY = 'sk-e580e4d0d96d43e3a98244fbc232419e';
  const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1';

  // 测试DeepSeek聊天API
  const testChatApi = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      console.log('🔍 测试DeepSeek聊天API...');
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: '你好，请简单介绍一下你自己' }
          ],
          stream: false,
          temperature: 0.95,
          max_tokens: 100
        }),
      });

      console.log('📡 DeepSeek聊天API响应状态:', response.status);
      console.log('📡 DeepSeek聊天API响应URL:', response.url);
      console.log('📡 DeepSeek聊天API响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ DeepSeek聊天API错误响应:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 300)}`);
      }

      const data = await response.json();
      console.log('✅ DeepSeek聊天API响应成功:', data);

      if (data.choices && data.choices[0] && data.choices[0].message) {
        setResult(`✅ DeepSeek聊天API调用成功！\n\n🤖 AI回复: ${data.choices[0].message.content}\n\n📊 使用统计:\n• 输入Token: ${data.usage?.prompt_tokens || '未知'}\n• 输出Token: ${data.usage?.completion_tokens || '未知'}  \n• 总Token: ${data.usage?.total_tokens || '未知'}\n\n🎯 这说明您的API Key有效，API配置正确！`);
      } else {
        setResult(`⚠️ API响应格式异常:\n${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      console.error('❌ DeepSeek聊天API测试失败:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 测试简单的代理连接（DeepSeek无代理，保留结构但提示不支持）
  const testProxyConnection = async () => {
    setLoading(true);
    setError('');
    setResult('');
    setTimeout(() => {
      setResult('🌐 DeepSeek API 不支持本地代理测试，请直接使用API Key调用。');
      setLoading(false);
    }, 800);
  };

  // 直接测试DeepSeek API
  const testDirectApi = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      console.log('🔍 直接测试DeepSeek API...');
      const response = await fetch('https://api.deepseek.com/v1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 直接API响应状态:', response.status);
      console.log('📡 直接API响应URL:', response.url);
      console.log('📡 直接API响应头:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('📡 直接API响应内容:', responseText.substring(0, 500));

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          setResult(`✅ 直接API调用成功！\n模型数量: ${data.data?.length || '未知'}\n响应: ${JSON.stringify(data, null, 2)}`);
        } catch (parseError) {
          setResult(`⚠️ 响应不是有效JSON:\n${responseText}`);
        }
      } else {
        setError(`❌ 直接API调用失败 (${response.status}): ${responseText}`);
      }
    } catch (error: any) {
      console.error('❌ 直接API测试失败:', error);
      setError(`❌ 直接API测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 详细的API Key验证
  const validateApiKey = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      console.log('🔍 开始详细验证DeepSeek API Key...');
      const modelsResponse = await fetch('https://api.deepseek.com/v1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
      });

      console.log('📡 模型列表API响应状态:', modelsResponse.status);
      console.log('📡 模型列表API响应URL:', modelsResponse.url);
      console.log('📡 模型列表API响应头:', Object.fromEntries(modelsResponse.headers.entries()));

      const contentType = modelsResponse.headers.get('content-type');
      const responseText = await modelsResponse.text();
      console.log('📡 响应内容类型:', contentType);
      console.log('📡 响应内容前500字符:', responseText.substring(0, 500));

      if (modelsResponse.ok) {
        try {
          const data = JSON.parse(responseText);
          setResult(`✅ API Key验证成功！\n\n📊 模型列表响应:\n${JSON.stringify(data, null, 2)}\n\n🎯 这说明您的API Key有效，可以继续测试聊天功能。`);
        } catch (parseError) {
          setResult(`⚠️ API返回了非JSON格式数据:\n响应状态: ${modelsResponse.status}\n响应内容: ${responseText.substring(0, 1000)}\n这可能表明API端点或请求格式有问题。`);
        }
      } else {
        setResult(`❌ API Key验证失败\n\n🔍 详细分析:\n• 响应状态: ${modelsResponse.status}\n• 响应URL: ${modelsResponse.url}\n• 内容类型: ${contentType}\n• 这表明请求被拒绝或API Key无效\n\n💡 可能的原因:\n1. API Key无效或过期\n2. 权限不足\n3. DeepSeek账户状态有问题\n4. API端点配置错误`);
      }
    } catch (error: any) {
      console.error('❌ API Key验证失败:', error);
      setError(`API Key验证失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 替代认证方式测试（DeepSeek无特殊认证，仅保留结构）
  const testAlternativeAuth = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      console.log('🔍 尝试替代认证方式测试...');
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'user', content: '你好，请简单介绍一下你自己' }
          ],
          stream: false,
          max_tokens: 100
        }),
      });

      console.log('📡 替代认证响应状态:', response.status);
      console.log('📡 替代认证响应URL:', response.url);
      console.log('📡 替代认证响应头:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('📡 替代认证响应内容:', responseText.substring(0, 500));

      if (response.ok) {
        try {
          const data = JSON.parse(responseText);
          setResult(`✅ 替代认证方式成功！\n\n🤖 AI回复: ${data.choices[0].message.content}\n\n📊 Token使用情况:\n- 输入Token: ${data.usage?.prompt_tokens || '未知'}\n- 输出Token: ${data.usage?.completion_tokens || '未知'}\n- 总Token: ${data.usage?.total_tokens || '未知'}\n\n🎯 这说明API配置正确，可以正常使用！`);
        } catch (parseError) {
          setResult(`⚠️ 响应不是有效JSON:\n${responseText}`);
        }
      } else {
        setError(`❌ 替代认证失败 (${response.status}): ${responseText}`);
      }
    } catch (error: any) {
      console.error('❌ 替代认证测试失败:', error);
      setError(`❌ 替代认证测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🧪 DeepSeek API测试</Title>
      <Alert
        message="🎯 关键发现"
        description={
          <div>
            <Text strong>问题分析: </Text>
            <br />
            • 您的API Key测试返回了HTML页面或错误响应
            <br />
            • 这通常意味着API Key无效或请求被拒绝
            <br />
            <Text strong>解决方案: </Text>
            <br />
            • 重点测试聊天API（最重要的功能）
            <br />
            • 如果聊天API失败，需要更新API Key
          </div>
        }
        type="warning"
        style={{ marginBottom: '24px' }}
      />
      <Alert
        message="API配置信息"
        description={
          <div>
            <Text strong>API Key: </Text>
            <Text code>{DEEPSEEK_API_KEY}</Text>
            <br />
            <Text strong>聊天API端点: </Text>
            <Text code>https://api.deepseek.com/chat/completions</Text>
            <br />
            <Text strong>模型: </Text>
            <Text code>deepseek-chat</Text>
            <br />
            <Text strong>认证方式: </Text>
            <Text code>Bearer Token</Text>
          </div>
        }
        type="info"
        style={{ marginBottom: '24px' }}
      />
      <Card title="🔧 API测试工具" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            <Text strong>推荐测试顺序：</Text>
            <br />
            1. 先测试聊天API（最重要）
            <br />
            2. 如果失败，测试API Key有效性
            <br />
            3. 如果需要，测试直接API（可查看模型列表）
          </Paragraph>
          <Space wrap>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={validateApiKey}
              loading={loading}
              size="large"
            >
              🔑 验证API Key
            </Button>
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              onClick={testChatApi}
              loading={loading}
              size="large"
            >
              🧪 测试聊天API (重点)
            </Button>
            <Button 
              onClick={testProxyConnection}
              loading={loading}
            >
              🌐 代理连接测试（无效）
            </Button>
            <Button 
              type="primary" 
              onClick={testDirectApi}
              loading={loading}
              style={{ marginRight: 8 }}
            >
              🌐 直接测试API
            </Button>
            <Button 
              type="default" 
              onClick={testAlternativeAuth}
              loading={loading}
              style={{ marginRight: 8 }}
            >
              🔄 替代认证测试
            </Button>
          </Space>
        </Space>
      </Card>
      {loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>正在测试API...</div>
          </div>
        </Card>
      )}
      {error && (
        <Alert
          message="❌ 测试失败"
          description={<pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{error}</pre>}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      {result && (
        <Card title="📊 测试结果">
          <TextArea
            value={result}
            rows={15}
            readOnly
            style={{ fontFamily: 'monospace' }}
          />
        </Card>
      )}
      <Divider />
      <Card title="🚨 如果聊天API失败，请执行以下步骤" size="small">
        <Paragraph>
          <Text strong>1. 获取新的API Key：</Text>
          <ol>
            <li>访问 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">DeepSeek平台 - API Key页面</a></li>
            <li>检查当前API Key是否有效</li>
            <li>如果无效，生成新的API Key</li>
            <li>确认账户有API调用权限</li>
            <li>检查Token余额是否充足</li>
          </ol>
          <Text strong>2. 更新API Key：</Text>
          <br />
          将新的API Key告诉我，我会帮您更新到代码中的以下位置：
          <br />
          • <Text code>src/pages/ApiTestPage.tsx</Text>
        </Paragraph>
      </Card>
      <Card title="📖 官方文档参考" size="small">
        <Paragraph>
          <Text strong>DeepSeek大模型API:</Text>
          <br />
          • 服务域名: <Text code>https://api.deepseek.com</Text>
          <br />
          • 兼容OpenAI SDK格式
          <br />
          • 支持模型: deepseek-chat, deepseek-reasoner等
          <br />
          • 免费额度: 详见官网
          <br />
          • API Key页面: <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">点击访问</a>
        </Paragraph>
      </Card>
    </div>
  );
};

export default ApiTestPage; 