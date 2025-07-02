import React, { useState, useRef, useEffect } from 'react';
import { Modal, Input, Button, message, Spin, Typography, Space, Divider } from 'antd';
import { SendOutlined, AudioOutlined, StopOutlined, EllipsisOutlined } from '@ant-design/icons';
import { deepSeekAiService, ChatMessage } from '../../services/baiduAiService';
import { speechService, SpeechRecognitionResult } from '../../services/speechService';
import './AiChatDialog.css';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface AiChatDialogProps {
  visible: boolean;
  onClose: () => void;
  locationName?: string;
  initialQuestion?: string;
}


// 新增：景点实景图映射
const LOCATION_IMAGES: { [key: string]: string } = {
  '万寿斋': '/png/6.png',
  '四新汤圆': '/png/4.png',
  '好好栗子': '/png/1.png', 
  '伊斯兰餐厅': '/png/3.png',
  '甜爱路': '/png/5.png',
  '虹口糕团': '/png/2.png'
};

// 删除这整个部分：
// const LOCATION_SITE_IMAGES: { [key: string]: string } = {
//   '万寿斋': '/site/7.png',
//   '四新汤圆': '/site/5.png',
//   '好好栗子': '/site/1.png', 
//   '清真牛肉包': '/site/3.png',
//   '甜爱路': '/site/6.png',
//   '虹口糕团': '/site/2.png',
//   '石库门': '/site/4.png',
//   '左联': '/site/8.png'
// };

// 添加检测景点名称的函数
const detectLocationInText = (text: string): string | null => {
  const locationCounts: { [key: string]: number } = {};
  
  // 统计每个景点名称在文本中的出现次数
  for (const location of Object.keys(LOCATION_IMAGES)) {
    const matches = text.match(new RegExp(location, 'g'));
    if (matches) {
      locationCounts[location] = matches.length;
    }
  }
  
  // 如果没有匹配到任何景点，返回 null
  if (Object.keys(locationCounts).length === 0) {
    return null;
  }
  
  // 返回出现次数最多的景点名称
  return Object.keys(locationCounts).reduce((a, b) => 
    locationCounts[a] > locationCounts[b] ? a : b
  );
};

interface ChatHistoryItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  canExpand?: boolean;
  locationImage?: string;
  // 删除这行：locationSiteImage?: string;
}

const AiChatDialog: React.FC<AiChatDialogProps> = ({
  visible,
  onClose,
  locationName,
  initialQuestion
}) => {
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null);
  // 添加状态来跟踪是否是继续深入了解的请求
  const [isDetailedExploration, setIsDetailedExploration] = useState(false);
  // 添加状态来跟踪已显示过图片的景点
  const [shownLocationImages, setShownLocationImages] = useState<Set<string>>(new Set());
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);

  // 初始化时设置初始问题
  useEffect(() => {
    if (visible && initialQuestion) {
      setInputText(initialQuestion);
    }
  }, [visible, initialQuestion]);

  // 滚动到底部
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // 滚动到底部（延迟执行）
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [chatHistory]);

  // 生成唯一ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // 新增：继续深入了解功能
  const continueDetailedExploration = async (messageId: string, originalContent: string) => {
    setIsLoading(true);
    setIsDetailedExploration(true); // 标记为深入了解请求
    
    try {
      // 创建消息历史
      const messages: ChatMessage[] = [];
      
      // 添加系统提示
      if (locationName) {
        let systemPrompt = `你是一位深谙虹口历史文化的专家型向导。请围绕"海派文化发祥地、先进文化策源地、文化名人聚集地"的"文化三地"核心定位，结合用户对"${locationName}"的提问，提供有深度、有温度的讲解。你的回答应注重历史文脉的传承与红色基因的赓续，展现虹口作为"习近平文化思想最佳实践区"的独特魅力。请以真实、生动且富有感染力的语言，将相关的历史事件、文化名人、特色风貌娓娓道来，激发用户对虹口文化的认同感与自豪感，注意不能出现宗教相关信息。`;
        
        // 为伊斯兰餐厅添加特殊提示
        if (locationName === '伊斯兰餐厅') {
          systemPrompt += `特别注意：介绍伊斯兰餐厅时，重点突出其招牌美食"牛肉煎包"的制作工艺、口感特色和历史传承，强调其作为上海传统小吃的文化价值和在当地的影响力。介绍内容应聚焦于美食文化、制作技艺、口味特色等方面，完全避免涉及任何宗教背景、宗教习俗或宗教相关的内容。`;
        }
        
        systemPrompt += `请使用纯文本格式回答，不要使用任何markdown语法符号，回答内容请控制在200字以内。`;
        
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      } else {
        messages.push({
          role: 'system',
          content: '你是一位深谙虹口历史文化的专家型向导。请围绕"海派文化发祥地、先进文化策源地、文化名人聚集地"的"文化三地"核心定位，以真实、生动且富有感染力的语言，向用户介绍虹口区的历史文脉与红色故事，展现虹口作为"习近平文化思想最佳实践区"的独特魅力，激发用户对虹口文化的认同感与自豪感，注意不能出现宗教相关信息。请使用纯文本格式回答，不要使用任何markdown语法符号，回答内容请控制在200字以内。'
        });
      }

      // 添加原始内容作为上下文
      messages.push({
        role: 'assistant',
        content: originalContent
      });

      // 添加继续深入了解的请求
      messages.push({
        role: 'user',
        content: '请继续详细介绍，提供更多深入的信息和背景知识，回答以:让我来告诉你关于xxx的详细内容 为开头。'
      });

      // 创建新的助手消息（深入了解时不显示图片）
      const assistantMessageId = generateId();
      const assistantMessage: ChatHistoryItem = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        canExpand: true
      };
  
      setChatHistory(prev => [...prev, assistantMessage]);
      setCurrentStreamingId(assistantMessageId);
  
      // 使用流式响应
      let fullResponse = '';
      
      for await (const chunk of deepSeekAiService.chatStream(messages)) {
        fullResponse += chunk;
        
        // 深入了解时不显示图片，但保持原有的更新逻辑
        setChatHistory(prev => 
          prev.map(item => 
            item.id === assistantMessageId 
              ? { 
                  ...item, 
                  content: fullResponse
                }
              : item
          )
        );
      }
      
      // 完成流式响应
      setChatHistory(prev => 
        prev.map(item => 
          item.id === assistantMessageId 
            ? { ...item, isStreaming: false }
            : item
        )
      );
      
    } catch (error) {
      console.error('获取详细信息失败:', error);
      message.error('获取详细信息失败，请重试');
    } finally {
      setIsLoading(false);
      setCurrentStreamingId(null);
      setIsDetailedExploration(false);
    }
  };

  // 发送消息
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatHistoryItem = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // 创建消息历史
      const messages: ChatMessage[] = [];
      
      // 添加系统提示
      if (locationName) {
        let systemPrompt = `你是一位深谙虹口历史文化的专家型向导。请围绕“海派文化发祥地、先进文化策源地、文化名人聚集地”的“文化三地”核心定位，结合用户对“${locationName}”的提问，提供有深度、有温度的讲解。你的回答应注重历史文脉的传承与红色基因的赓续，展现虹口作为“习近平文化思想最佳实践区”的独特魅力。请以真实、生动且富有感染力的语言，将相关的历史事件、文化名人、特色风貌娓娓道来，激发用户对虹口文化的认同感与自豪感。回答内容请控制在200字以内。`;
        // 为伊斯兰餐厅添加特殊提示
        if (locationName === '伊斯兰餐厅') {
          systemPrompt += `特别注意：介绍伊斯兰餐厅时，重点突出其招牌美食"牛肉煎包"的制作工艺、口感特色和历史传承，强调其作为上海传统小吃的文化价值和在当地的影响力。介绍内容应聚焦于美食文化、制作技艺、口味特色等方面，完全避免涉及任何宗教背景、宗教习俗或宗教相关的内容。`;
        }
        messages.push({
          role: 'system',
          content: systemPrompt
        });
      } else {
        messages.push({
          role: 'system',
          content: '你是一位深谙虹口历史文化的专家型向导。请围绕“海派文化发祥地、先进文化策源地、文化名人聚集地”的“文化三地”核心定位，以真实、生动且富有感染力的语言，向用户介绍虹口区的历史文脉与红色故事，展现虹口作为“习近平文化思想最佳实践区”的独特魅力，激发用户对虹口文化的认同感与自豪感。回答内容请控制在200字以内'
        });
      }

      // 添加聊天历史（最近10条）
      const recentHistory = chatHistory.slice(-10);
      recentHistory.forEach(item => {
        messages.push({
          role: item.role,
          content: item.content
        });
      });

      // 添加当前用户消息
      messages.push({
        role: 'user',
        content: text.trim()
      });

      // 创建助手消息占位符
      const assistantMessageId = generateId();
      const assistantMessage: ChatHistoryItem = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        canExpand: true
      };

      setChatHistory(prev => [...prev, assistantMessage]);
      setCurrentStreamingId(assistantMessageId);

      // 使用流式响应
      let fullResponse = '';
      
      for await (const chunk of deepSeekAiService.chatStream(messages)) {
        fullResponse += chunk;
        
        setChatHistory(prev => 
          prev.map(item => 
            item.id === assistantMessageId 
              ? { 
                  ...item, 
                  content: fullResponse
                }
              : item
          )
        );
      }
      
      // 完成流式响应后，检测景点并显示图片
      const detectedLocation = detectLocationInText(fullResponse);
      // 只有在非深入了解请求、检测到景点且该景点未显示过图片时才显示
      const shouldShowImage = !isDetailedExploration && detectedLocation && !shownLocationImages.has(detectedLocation);
      
      setChatHistory(prev => 
        prev.map(item => 
          item.id === assistantMessageId 
            ? { 
                ...item, 
                isStreaming: false,
                locationImage: shouldShowImage ? LOCATION_IMAGES[detectedLocation] : undefined
              }
            : item
        )
      );
      
      // 如果显示了图片，将该景点添加到已显示列表中
      if (shouldShowImage) {
        setShownLocationImages(prev => new Set(prev).add(detectedLocation));
      }
      
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送消息失败，请重试');
      
      // 移除失败的助手消息
      setChatHistory(prev => prev.filter(item => item.id !== currentStreamingId));
    } finally {
      setIsLoading(false);
      setCurrentStreamingId(null);
    }
  };

  // 处理发送按钮点击
  const handleSend = () => {
    sendMessage(inputText);
  };

  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 开始语音识别
  const startVoiceInput = async () => {
    if (!speechService.getIsSupported()) {
      message.error('当前浏览器不支持语音识别功能，建议使用Chrome或Edge浏览器');
      return;
    }

    try {
      setIsListening(true);
      setSpeechText('');

      await speechService.startListening(
        {
          language: 'zh-CN',
          continuous: false,
          interimResults: true
        },
        {
          onStart: () => {
            message.info('开始语音识别，请说话...');
          },
          onResult: (result: SpeechRecognitionResult) => {
            setSpeechText(result.transcript);
            if (result.isFinal) {
              setInputText(result.transcript);
              setIsListening(false);
              setSpeechText('');
            }
          },
          onError: (error: string) => {
            message.error(`语音识别错误: ${error}`);
            setIsListening(false);
            setSpeechText('');
          },
          onEnd: () => {
            setIsListening(false);
            setSpeechText('');
          }
        }
      );
    } catch (error) {
      message.error('启动语音识别失败，请检查麦克风权限或网络连接');
      setIsListening(false);
      setSpeechText('');
    }
  };

  // 停止语音识别
  const stopVoiceInput = () => {
    speechService.stopListening();
    setIsListening(false);
    setSpeechText('');
  };

  // 清空聊天历史
  const clearHistory = () => {
    setChatHistory([]);
    setShownLocationImages(new Set()); // 重置已显示图片的记录
  };

  // 关闭对话框
  const handleClose = () => {
    if (isListening) {
      stopVoiceInput();
    }
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>小道新貌研学创作助手{locationName ? ` - ${locationName}` : ''}</span>
          <Button 
            type="text" 
            size="small" 
            onClick={clearHistory}
            disabled={chatHistory.length === 0}
          >
            清空对话
          </Button>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
      className="ai-chat-dialog"
      destroyOnHidden
    >
      <div className="chat-container">
        {/* 聊天历史区域 */}
        <div className="chat-history" ref={chatContainerRef}>
          {chatHistory.length === 0 ? (
            <div className="empty-chat">
              <Text type="secondary">
                {locationName 
                  ? `你好！我是小道新貌研学创作助手，可以为你介绍${locationName}的相关信息。有什么想了解的吗？`
                  : '你好！我是小道新貌研学创作助手，可以为你介绍虹口区的各个景点和文化场所。有什么想了解的吗？'
                }
              </Text>
            </div>
          ) : (
            chatHistory.map(item => (
              <div key={item.id} className={`chat-message ${item.role}`}>
                <div className="message-content">
                  <div className="message-header">
                    <Text strong>{item.role === 'user' ? '你' : 'AI助手'}</Text>
                    <Text type="secondary" className="message-time">
                      {item.timestamp.toLocaleTimeString()}
                    </Text>
                  </div>
                  <div className="message-text">
                    <Paragraph>
                      {item.content}
                      {item.isStreaming && <span className="streaming-cursor">|</span>}
                    </Paragraph>
                    {/* 修改：显示景点图片和实景图 */}
                    {item.role === 'assistant' && (item.locationImage || item.locationImage) && (
                      <div className="location-images-container">
                        
                        {/* 实景图 */}
                        {item.role === 'assistant' && item.locationImage && (
                        <div className="location-images-container">
                        {/* 只保留实景图 */}
                        <div className="location-image-wrapper">
                        <img 
                        src={item.locationImage} 
                        alt="景点实景图" 
                        className="location-image"
                        onError={(e) => {
                        console.warn('实景图片加载失败:', item.locationImage);
                        e.currentTarget.style.display = 'none';
                        }}
                        />
                        <div className="image-label">实景图</div>
                        </div>
                        </div>
                        )}
                      </div>
                    )}
                    {/* 继续深入了解按钮 */}
                    {item.role === 'assistant' && 
                     item.canExpand && 
                     !item.isStreaming && 
                     item.content.trim() && (
                      <div className="message-actions">
                        <Button 
                          type="link" 
                          size="small"
                          icon={<EllipsisOutlined />}
                          onClick={() => continueDetailedExploration(item.id, item.content)}
                          disabled={isLoading}
                          className="continue-button"
                        >
                          继续深入了解
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && !currentStreamingId && (
            <div className="chat-message assistant">
              <div className="message-content">
                <div className="message-header">
                  <Text strong>AI助手</Text>
                </div>
                <div className="message-text">
                  <Spin size="small" /> <Text type="secondary">正在思考...</Text>
                </div>
              </div>
            </div>
          )}
        </div>

        <Divider style={{ margin: '12px 0' }} />

        {/* 语音识别状态显示 */}
        {(isListening || speechText) && (
          <div className="speech-status">
            <Text type="secondary">
              {isListening ? '🎤 正在听取语音...' : ''}
              {speechText && (
                <span style={{ color: '#1890ff' }}>识别中: {speechText}</span>
              )}
            </Text>
          </div>
        )}

        {/* 输入区域 */}
        <div className="chat-input-area">
          <div className="input-container">
            <TextArea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={locationName ? `询问关于${locationName}的问题...` : "输入你的问题..."}
              autoSize={{ minRows: 1, maxRows: 4 }}
              disabled={isLoading}
            />
            <div className="input-actions">
              <Space>
                <Button
                  type="text"
                  icon={isListening ? <StopOutlined /> : <AudioOutlined />}
                  onClick={isListening ? stopVoiceInput : startVoiceInput}
                  disabled={isLoading}
                  className={isListening ? 'listening' : ''}
                  title={isListening ? '停止语音输入' : '开始语音输入'}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  title="发送消息"
                />
              </Space>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AiChatDialog;
