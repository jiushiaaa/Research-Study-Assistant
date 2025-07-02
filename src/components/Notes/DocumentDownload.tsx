import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Dropdown, 
  Menu, 
  Divider, 
  Input, 
  message, 
  Modal, 
  Tooltip, 
  Switch, 
  Checkbox, 
  Space, 
  Tabs, 
  Progress, 
  Radio, 
  Select,
  Typography
} from 'antd';
import { 
  DownloadOutlined, 
  ShareAltOutlined, 
  CopyOutlined, 
  QrcodeOutlined, 
  SaveOutlined, 
  FileTextOutlined,
  EyeOutlined,
  FileMarkdownOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { TabPane } = Tabs;
const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

// 自定义简单 QR 码组件
const SimpleQRCode: React.FC<{ value: string; size: number }> = ({ value, size }) => {
  return (
    <div 
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: '#f0f0f0', 
        border: '1px solid #ddd',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px'
      }}
    >
      <QrcodeOutlined style={{ fontSize: size / 3, color: '#1890ff', marginBottom: 10 }} />
      <div style={{ fontSize: 12, textAlign: 'center', wordBreak: 'break-all' }}>
        {value.substring(0, 30)}...
      </div>
      <div style={{ fontSize: 10, color: '#999', marginTop: 10 }}>
        (二维码功能将在安装依赖后启用)
      </div>
    </div>
  );
};

interface DocumentOptions {
  includeNotes: boolean;
  includeQuestions: boolean;
  includeTopics: boolean;
  includeMaps: boolean;
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includeAttachments: boolean;
  template: string;
  headerFooterType: string;
  pageSize: string;
}

// 文档模板配置
const DOCUMENT_TEMPLATES = [
  { id: 'standard', name: '标准模板', description: '简洁专业的标准研学模板' },
  { id: 'creative', name: '创意模板', description: '色彩丰富，适合低年级学生' },
  { id: 'academic', name: '学术模板', description: '偏学术风格，适合高年级学生' },
];

// 支持的文档格式
const DOCUMENT_FORMATS = [
  { id: 'pdf', name: 'PDF文档', icon: <FilePdfOutlined /> },
  { id: 'word', name: 'Word文档', icon: <FileWordOutlined /> },
  { id: 'markdown', name: 'Markdown', icon: <FileMarkdownOutlined /> },
  { id: 'excel', name: '表格文档', icon: <FileExcelOutlined /> },
  { id: 'image', name: '图片合集', icon: <FileImageOutlined /> },
];

const DocumentDownload: React.FC<{ routeId: string }> = ({ routeId }) => {
  const [shareLink, setShareLink] = useState<string>('');
  const [qrVisible, setQrVisible] = useState(false);
  const [documentOptions, setDocumentOptions] = useState<DocumentOptions>({
    includeNotes: true,
    includeQuestions: true,
    includeTopics: true,
    includeMaps: true,
    includeCoverPage: true,
    includeTableOfContents: true,
    includeAttachments: false,
    template: 'standard',
    headerFooterType: 'simple',
    pageSize: 'a4'
  });
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [autosaveDraft, setAutosaveDraft] = useState(true);
  const [draftSaved, setDraftSaved] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFormat, setGeneratingFormat] = useState('');
  
  // 加载保存的草稿设置
  useEffect(() => {
    const savedOptions = localStorage.getItem(`docOptions_${routeId}`);
    if (savedOptions) {
      try {
        const parsedOptions = JSON.parse(savedOptions);
        setDocumentOptions({ ...documentOptions, ...parsedOptions });
        setDraftSaved(true);
      } catch (error) {
        console.error('Error parsing saved options:', error);
      }
    }
  }, [routeId]);
  
  // 保存草稿设置
  const saveDraftOptions = () => {
    localStorage.setItem(`docOptions_${routeId}`, JSON.stringify(documentOptions));
    setDraftSaved(true);
    message.success('文档设置已保存为草稿');
  };
  
  // 自动保存草稿
  useEffect(() => {
    if (autosaveDraft && JSON.stringify(documentOptions) !== localStorage.getItem(`docOptions_${routeId}`)) {
      const timer = setTimeout(() => {
        saveDraftOptions();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [documentOptions, autosaveDraft, routeId]);
  
  // 模拟文档生成进度
  const simulateGeneratingProgress = (format: string, onComplete: () => void) => {
    setGeneratingFormat(format);
    setIsGenerating(true);
    setGeneratingProgress(0);
    
    const interval = setInterval(() => {
      setGeneratingProgress(prev => {
        const newProgress = prev + Math.floor(Math.random() * 10);
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            onComplete();
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 200);
    
    return () => clearInterval(interval);
  };
  
  // 模拟文档生成函数
  const generateDocument = (format: string) => {
    if (isGenerating) {
      message.warning('已有文档正在生成中，请稍候...');
      return;
    }
    
    message.loading(`正在生成${getFormatDisplayName(format)}...`, 0);
    
    // 模拟生成过程
    simulateGeneratingProgress(format, () => {
      // 生成完成后的操作
      message.destroy(); // 清除之前的loading消息
      
      // 模拟下载链接
      const downloadUrl = `https://example.com/download?routeId=${routeId}&format=${format}&template=${documentOptions.template}`;
      
      // 创建一个隐形的a标签并触发下载
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `研学手册_${new Date().toISOString().split('T')[0]}.${getFileExtension(format)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      message.success(`${getFormatDisplayName(format)}已生成，开始下载`);
    });
  };
  
  // 获取文件格式的显示名称
  const getFormatDisplayName = (format: string): string => {
    const formatInfo = DOCUMENT_FORMATS.find(item => item.id === format);
    return formatInfo ? formatInfo.name : format.toUpperCase();
  };
  
  // 获取文件扩展名
  const getFileExtension = (format: string): string => {
    switch(format) {
      case 'pdf': return 'pdf';
      case 'word': return 'docx';
      case 'markdown': return 'md';
      case 'excel': return 'xlsx';
      case 'image': return 'zip';
      default: return format;
    }
  };
  
  // 更新文档选项
  const handleOptionChange = (option: keyof DocumentOptions) => {
    setDocumentOptions({
      ...documentOptions,
      [option]: !documentOptions[option]
    });
    setDraftSaved(false);
  };
  
  // 更新选择型文档选项
  const handleSelectOptionChange = (option: keyof DocumentOptions, value: string) => {
    setDocumentOptions({
      ...documentOptions,
      [option]: value
    });
    setDraftSaved(false);
  };
  
  // 生成分享链接
  const generateShareLink = () => {
    message.loading('正在生成分享链接...', 1);
    
    // 实际项目中，这里应该调用后端API生成唯一链接
    setTimeout(() => {
      const link = `https://urban-study.example.com/share/${routeId}/${Math.random().toString(36).substring(2, 10)}`;
      setShareLink(link);
      message.success('分享链接已生成');
    }, 1000);
  };
  
  // 复制链接到剪贴板
  const copyLink = () => {
    navigator.clipboard.writeText(shareLink).then(() => {
      message.success('链接已复制到剪贴板');
    });
  };
  
  // 打开文档选项
  const showDocumentOptions = () => {
    setOptionsVisible(true);
  };
  
  // 打开文档预览
  const showPreview = () => {
    setPreviewVisible(true);
  };
  
  // 下载菜单
  const menu = (
    <Menu>
      {DOCUMENT_FORMATS.map(format => (
        <Menu.Item key={format.id} onClick={() => generateDocument(format.id)}>
          {format.icon} {format.name}
        </Menu.Item>
      ))}
      <Menu.Divider />
      <Menu.Item key="preview" onClick={showPreview}>
        <EyeOutlined /> 预览文档
      </Menu.Item>
      <Menu.Item key="options" onClick={showDocumentOptions}>
        <SettingOutlined /> 文档选项
      </Menu.Item>
    </Menu>
  );

  // 获取当前模板名称
  const getCurrentTemplateName = () => {
    const template = DOCUMENT_TEMPLATES.find(t => t.id === documentOptions.template);
    return template ? template.name : '标准模板';
  };

  // 渲染预览内容
  const renderPreviewContent = () => {
    return (
      <div className="document-preview">
        {documentOptions.includeCoverPage && (
          <div className="preview-section">
            <Title level={4}>封面</Title>
            <div className="preview-cover" style={{ 
              height: 180, 
              background: '#f0f5ff', 
              borderRadius: 4, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              border: '1px solid #d9d9d9'
            }}>
              <Title level={3}>虹口区研学手册</Title>
              <Paragraph>模板: {getCurrentTemplateName()}</Paragraph>
              <Paragraph type="secondary">生成时间: {new Date().toLocaleDateString()}</Paragraph>
            </div>
          </div>
        )}
        
        {documentOptions.includeTableOfContents && (
          <div className="preview-section">
            <Title level={4}>目录</Title>
            <div className="preview-toc">
              <Paragraph>1. 研学路线概述 ......................... 1</Paragraph>
              <Paragraph>2. 研学景点介绍 ......................... 3</Paragraph>
              {documentOptions.includeQuestions && (
                <Paragraph>3. 引导问题集 ........................... 7</Paragraph>
              )}
              {documentOptions.includeTopics && (
                <Paragraph>4. 创作主题提示 ......................... 9</Paragraph>
              )}
              {documentOptions.includeNotes && (
                <Paragraph>5. 笔记内容 ............................. 12</Paragraph>
              )}
              {documentOptions.includeMaps && (
                <Paragraph>6. 地图与路线 ........................... 15</Paragraph>
              )}
            </div>
          </div>
        )}
        
        <div className="preview-section">
          <Title level={4}>研学路线概述</Title>
          <Paragraph>本研学路线涵盖虹口区多个具有特色的文化、历史地标，帮助学生深入了解城市文化...</Paragraph>
        </div>
        
        <div className="preview-section">
          <Title level={4}>研学景点介绍</Title>
          <div className="preview-landmark">
            <Title level={5}>1. 多伦路文化名人街</Title>
            <Paragraph>多伦路文化名人街位于上海市虹口区，是上海著名的历史文化街区...</Paragraph>
          </div>
          <div className="preview-landmark">
            <Title level={5}>2. 鲁迅公园与墓</Title>
            <Paragraph>鲁迅公园位于上海市虹口区四川北路，是为纪念文学家鲁迅先生而建...</Paragraph>
          </div>
        </div>
        
        {documentOptions.includeQuestions && (
          <div className="preview-section">
            <Title level={4}>引导问题集</Title>
            <div className="preview-questions">
              <Paragraph>• 这条街道的建筑风格有哪些特点？</Paragraph>
              <Paragraph>• 这里曾经住过哪些文化名人？他们有什么贡献？</Paragraph>
              <Paragraph>• 如何评价这条街道的文化保护工作？</Paragraph>
            </div>
          </div>
        )}
        
        {documentOptions.includeTopics && (
          <div className="preview-section">
            <Title level={4}>创作主题提示</Title>
            <div className="preview-topics">
              <div className="preview-topic">
                <Title level={5}>速写：今潮8弄新旧融合</Title>
                <Paragraph>尝试用速写的方式记录新旧建筑的对比</Paragraph>
              </div>
              <div className="preview-topic">
                <Title level={5}>想象对话：与鲁迅的一次交谈</Title>
                <Paragraph>如果你能与鲁迅对话，你会问什么？</Paragraph>
              </div>
            </div>
          </div>
        )}
        
        {documentOptions.includeNotes && (
          <div className="preview-section">
            <Title level={4}>笔记内容</Title>
            <div className="preview-notes">
              <Paragraph>我的观察与感想...</Paragraph>
              <Paragraph type="secondary">记录于: 2023-05-16 14:30</Paragraph>
            </div>
          </div>
        )}
        
        {documentOptions.includeMaps && (
          <div className="preview-section">
            <Title level={4}>地图与路线</Title>
            <div className="preview-map" style={{ 
              height: 120, 
              background: '#f0f5ff', 
              borderRadius: 4, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: '1px solid #d9d9d9'
            }}>
              <Text type="secondary">[研学路线地图将显示在此]</Text>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card title="研学文档下载" className="download-card">
      {isGenerating ? (
        <div className="generating-progress">
          <Progress 
            percent={generatingProgress} 
            status="active" 
            style={{ marginBottom: 16 }}
          />
          <Text>正在生成{getFormatDisplayName(generatingFormat)}，请稍候...</Text>
        </div>
      ) : (
        <>
          <div className="download-options">
            <Dropdown overlay={menu}>
              <Button type="primary" icon={<DownloadOutlined />}>
                下载研学手册
              </Button>
            </Dropdown>
            
            <Button 
              type="default" 
              icon={<ShareAltOutlined />}
              onClick={generateShareLink}
              style={{ marginLeft: 16 }}
            >
              生成分享链接
            </Button>
            
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={showPreview}
              style={{ marginLeft: 16 }}
            >
              预览
            </Button>
            
            {!draftSaved && (
              <Tooltip title="保存当前文档设置为草稿">
                <Button
                  type="text"
                  icon={<SaveOutlined />}
                  onClick={saveDraftOptions}
                  style={{ marginLeft: 8 }}
                />
              </Tooltip>
            )}
          </div>
          
          <div className="document-options-summary" style={{ margin: '16px 0', fontSize: '13px', color: '#666' }}>
            <p>
              <FileTextOutlined style={{ marginRight: 5 }} />
              当前模板: <Text strong>{getCurrentTemplateName()}</Text> | 
              包含内容: 
              {documentOptions.includeCoverPage && ' 封面页、'}
              {documentOptions.includeTableOfContents && ' 目录、'}
              {documentOptions.includeNotes && ' 笔记内容、'}
              {documentOptions.includeQuestions && ' 引导问题、'}
              {documentOptions.includeTopics && ' 创作主题、'}
              {documentOptions.includeMaps && ' 地图路线'}
              {draftSaved && <span style={{ color: '#52c41a', marginLeft: 6 }}>(已保存草稿)</span>}
            </p>
          </div>
        </>
      )}
      
      {shareLink && (
        <div className="share-section" style={{ marginTop: 16 }}>
          <Divider>分享链接</Divider>
          
          <Input.Group compact>
            <Input 
              style={{ width: 'calc(100% - 32px)' }} 
              value={shareLink} 
              readOnly 
            />
            <Tooltip title="复制链接">
              <Button 
                icon={<CopyOutlined />} 
                onClick={copyLink}
              />
            </Tooltip>
          </Input.Group>
          
          <Button 
            type="link" 
            icon={<QrcodeOutlined />}
            onClick={() => setQrVisible(true)}
            style={{ marginTop: 8 }}
          >
            显示二维码
          </Button>
          
          <Modal
            title="扫描二维码访问"
            open={qrVisible}
            onCancel={() => setQrVisible(false)}
            footer={null}
            centered
          >
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <SimpleQRCode value={shareLink} size={200} />
              <p style={{ marginTop: 16 }}>使用手机扫描二维码查看研学手册</p>
            </div>
          </Modal>
        </div>
      )}
      
      {/* 文档选项模态框 */}
      <Modal
        title="文档选项设置"
        open={optionsVisible}
        onCancel={() => setOptionsVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setOptionsVisible(false)}>
            取消
          </Button>,
          <Button 
            key="save" 
            type="primary"
            onClick={() => {
              saveDraftOptions();
              setOptionsVisible(false);
            }}
          >
            保存设置
          </Button>
        ]}
      >
        <Tabs defaultActiveKey="content">
          <TabPane tab="文档内容" key="content">
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>选择要包含在研学文档中的内容：</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Checkbox 
                  checked={documentOptions.includeCoverPage}
                  onChange={() => handleOptionChange('includeCoverPage')}
                >
                  包含封面页
                </Checkbox>
                <Checkbox 
                  checked={documentOptions.includeTableOfContents}
                  onChange={() => handleOptionChange('includeTableOfContents')}
                >
                  包含目录
                </Checkbox>
                <Checkbox 
                  checked={documentOptions.includeNotes}
                  onChange={() => handleOptionChange('includeNotes')}
                >
                  包含笔记内容
                </Checkbox>
                <Checkbox 
                  checked={documentOptions.includeQuestions}
                  onChange={() => handleOptionChange('includeQuestions')}
                >
                  包含引导问题
                </Checkbox>
                <Checkbox 
                  checked={documentOptions.includeTopics}
                  onChange={() => handleOptionChange('includeTopics')}
                >
                  包含创作主题
                </Checkbox>
                <Checkbox 
                  checked={documentOptions.includeMaps}
                  onChange={() => handleOptionChange('includeMaps')}
                >
                  包含地图与路线
                </Checkbox>
                <Checkbox 
                  checked={documentOptions.includeAttachments}
                  onChange={() => handleOptionChange('includeAttachments')}
                >
                  包含相关资料附件
                </Checkbox>
              </Space>
            </div>
          </TabPane>
          
          <TabPane tab="文档模板" key="template">
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>选择文档模板：</Title>
              <Radio.Group 
                value={documentOptions.template}
                onChange={(e) => handleSelectOptionChange('template', e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {DOCUMENT_TEMPLATES.map(template => (
                    <Radio key={template.id} value={template.id} style={{ marginBottom: 8 }}>
                      <div>
                        <Text strong>{template.name}</Text>
                        <br />
                        <Text type="secondary">{template.description}</Text>
                      </div>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          </TabPane>
          
          <TabPane tab="页面设置" key="page">
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>页面设置：</Title>
              
              <div style={{ marginBottom: 16 }}>
                <Text>页面大小：</Text>
                <Select 
                  value={documentOptions.pageSize}
                  onChange={(value) => handleSelectOptionChange('pageSize', value)}
                  style={{ width: 200, marginLeft: 8 }}
                >
                  <Option value="a4">A4 (210 × 297 mm)</Option>
                  <Option value="letter">Letter (216 × 279 mm)</Option>
                  <Option value="a5">A5 (148 × 210 mm)</Option>
                </Select>
              </div>
              
              <div>
                <Text>页眉页脚：</Text>
                <Select 
                  value={documentOptions.headerFooterType}
                  onChange={(value) => handleSelectOptionChange('headerFooterType', value)}
                  style={{ width: 200, marginLeft: 8 }}
                >
                  <Option value="simple">简单样式</Option>
                  <Option value="detailed">详细信息</Option>
                  <Option value="none">无页眉页脚</Option>
                </Select>
              </div>
            </div>
          </TabPane>
          
          <TabPane tab="其他设置" key="other">
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>其他设置：</Title>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span>自动保存草稿</span>
                <Switch 
                  checked={autosaveDraft} 
                  onChange={(checked) => setAutosaveDraft(checked)}
                />
              </div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>
                打开此选项后，系统将自动保存您的文档设置
              </div>
              
              <Divider />
              
              <Button 
                onClick={() => {
                  setDocumentOptions({
                    includeNotes: true,
                    includeQuestions: true,
                    includeTopics: true,
                    includeMaps: true,
                    includeCoverPage: true,
                    includeTableOfContents: true,
                    includeAttachments: false,
                    template: 'standard',
                    headerFooterType: 'simple',
                    pageSize: 'a4'
                  });
                  setDraftSaved(false);
                  message.success('已恢复默认设置');
                }}
              >
                恢复默认设置
              </Button>
            </div>
          </TabPane>
        </Tabs>
      </Modal>
      
      {/* 文档预览模态框 */}
      <Modal
        title={`文档预览 (模板: ${getCurrentTemplateName()})`}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>,
          <Button 
            key="download" 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              setPreviewVisible(false);
              generateDocument('pdf');
            }}
          >
            下载PDF版本
          </Button>
        ]}
      >
        <div className="document-preview-container" style={{ 
          maxHeight: '60vh', 
          overflow: 'auto', 
          padding: '0 16px', 
          border: '1px solid #f0f0f0',
          borderRadius: 4,
          background: '#fff' 
        }}>
          {renderPreviewContent()}
        </div>
      </Modal>
    </Card>
  );
};

export default DocumentDownload;
