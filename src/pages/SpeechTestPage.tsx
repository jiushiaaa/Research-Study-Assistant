import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, Alert, Divider, Tag } from 'antd';
import { AudioOutlined, StopOutlined } from '@ant-design/icons';
import { speechService } from '../services/speechService';

const { Title, Text, Paragraph } = Typography;

const SpeechTestPage: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [browserInfo, setBrowserInfo] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('');

  useEffect(() => {
    // 检查浏览器支持
    setIsSupported(speechService.getIsSupported());
    
    // 获取浏览器信息
    const userAgent = navigator.userAgent;
    let browser = '未知浏览器';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    setBrowserInfo(`${browser} - ${window.location.protocol}//${window.location.host}`);
    
    // 检查权限状态
    checkPermissionStatus();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const checkPermissionStatus = async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' as any });
        setPermissionStatus(permission.state);
        addLog(`麦克风权限状态: ${permission.state}`);
      } else {
        setPermissionStatus('不支持权限查询');
        addLog('浏览器不支持权限查询API');
      }
    } catch (error) {
      setPermissionStatus('查询失败');
      addLog('权限查询失败');
    }
  };

  const startListening = async () => {
    try {
      setError('');
      setTranscript('');
      addLog('开始语音识别测试...');
      
      await speechService.startListening(
        {
          language: 'zh-CN',
          continuous: false,
          interimResults: true
        },
        {
          onStart: () => {
            setIsListening(true);
            addLog('✅ 语音识别已启动');
          },
          onEnd: () => {
            setIsListening(false);
            addLog('🔚 语音识别已结束');
          },
          onResult: (result) => {
            setTranscript(result.transcript);
            addLog(`📝 识别结果: "${result.transcript}" (置信度: ${result.confidence}, 最终: ${result.isFinal})`);
          },
          onError: (errorMsg) => {
            setError(errorMsg);
            setIsListening(false);
            addLog(`❌ 错误: ${errorMsg}`);
          },
          onNoMatch: () => {
            addLog('⚠️ 未匹配到语音');
          },
          onSoundStart: () => {
            addLog('🔊 检测到声音');
          },
          onSoundEnd: () => {
            addLog('🔇 声音结束');
          },
          onSpeechStart: () => {
            addLog('🗣️ 检测到语音');
          },
          onSpeechEnd: () => {
            addLog('🤐 语音结束');
          }
        }
      );
    } catch (error: any) {
      setError(error.message);
      setIsListening(false);
      addLog(`❌ 启动失败: ${error.message}`);
    }
  };

  const stopListening = () => {
    speechService.stopListening();
    setIsListening(false);
    addLog('⏹️ 手动停止语音识别');
  };

  const clearLogs = () => {
    setLogs([]);
    setTranscript('');
    setError('');
  };

  const testMicrophone = async () => {
    try {
      addLog('🎤 测试麦克风访问...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('✅ 麦克风访问成功');
      stream.getTracks().forEach(track => track.stop());
      await checkPermissionStatus();
    } catch (error: any) {
      addLog(`❌ 麦克风访问失败: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>语音识别测试页面</Title>
      
      <Card title="系统信息" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>浏览器: </Text>
            <Text>{browserInfo}</Text>
          </div>
          <div>
            <Text strong>语音识别支持: </Text>
            <Tag color={isSupported ? 'green' : 'red'}>
              {isSupported ? '支持' : '不支持'}
            </Tag>
          </div>
          <div>
            <Text strong>麦克风权限: </Text>
            <Tag color={
              permissionStatus === 'granted' ? 'green' : 
              permissionStatus === 'denied' ? 'red' : 'orange'
            }>
              {permissionStatus}
            </Tag>
          </div>
          <div>
            <Text strong>安全上下文: </Text>
            <Tag color={window.isSecureContext ? 'green' : 'red'}>
              {window.isSecureContext ? 'HTTPS/Localhost' : 'HTTP'}
            </Tag>
          </div>
        </Space>
      </Card>

      {!isSupported && (
        <Alert
          message="浏览器不支持语音识别"
          description="请使用Chrome、Edge或其他支持Web Speech API的浏览器"
          type="error"
          style={{ marginBottom: '20px' }}
        />
      )}

      {!window.isSecureContext && (
        <Alert
          message="需要安全上下文"
          description="语音识别需要HTTPS环境或localhost，请确保使用正确的协议"
          type="warning"
          style={{ marginBottom: '20px' }}
        />
      )}

      <Card title="测试控制" style={{ marginBottom: '20px' }}>
        <Space>
          <Button
            type="primary"
            icon={<AudioOutlined />}
            onClick={startListening}
            disabled={!isSupported || isListening}
            loading={isListening}
          >
            {isListening ? '正在监听...' : '开始语音识别'}
          </Button>
          
          <Button
            icon={<StopOutlined />}
            onClick={stopListening}
            disabled={!isListening}
          >
            停止识别
          </Button>
          
          <Button onClick={testMicrophone}>
            测试麦克风
          </Button>
          
          <Button onClick={clearLogs}>
            清空日志
          </Button>
        </Space>
      </Card>

      {transcript && (
        <Card title="识别结果" style={{ marginBottom: '20px' }}>
          <Paragraph style={{ fontSize: '16px', padding: '10px', backgroundColor: '#f6f6f6', borderRadius: '4px' }}>
            {transcript}
          </Paragraph>
        </Card>
      )}

      {error && (
        <Alert
          message="错误信息"
          description={error}
          type="error"
          style={{ marginBottom: '20px' }}
        />
      )}

      <Card title="调试日志">
        <div style={{ 
          height: '300px', 
          overflow: 'auto', 
          backgroundColor: '#f6f6f6', 
          padding: '10px', 
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {logs.length === 0 ? (
            <Text type="secondary">暂无日志...</Text>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '2px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </Card>

      <Divider />
      
      <Card title="使用说明">
        <Space direction="vertical">
          <Text>1. 确保使用Chrome或Edge浏览器</Text>
          <Text>2. 确保在HTTPS环境或localhost下访问</Text>
          <Text>3. 点击"开始语音识别"并允许麦克风权限</Text>
          <Text>4. 清晰地说出中文内容</Text>
          <Text>5. 查看调试日志了解详细执行过程</Text>
        </Space>
      </Card>
    </div>
  );
};

export default SpeechTestPage; 