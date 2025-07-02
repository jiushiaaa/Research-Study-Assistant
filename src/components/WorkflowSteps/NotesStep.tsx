import React, { useState, useEffect } from 'react';
import { Card, Button, message, Spin, Alert, Collapse, Tag, Tabs } from 'antd';
import { CheckOutlined, BookOutlined, BulbOutlined, Html5Outlined, FileTextOutlined } from '@ant-design/icons';
import { useWorkflow } from '../WorkflowContext';
import { studyPlanApi } from '../../services/apiService';

const { Panel } = Collapse;
const { TabPane } = Tabs;

const NotesStep: React.FC = () => {
  const { updateWorkflowData, workflowData, setCurrentStep } = useWorkflow();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingHtml, setIsGeneratingHtml] = useState(false);
  const [artNoteFramework, setArtNoteFramework] = useState<any>(null);
  const [artNoteHtml, setArtNoteHtml] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>('framework');

  useEffect(() => {
    // 检查是否有艺术笔记框架数据
    if (workflowData.artNoteFramework) {
      setArtNoteFramework(workflowData.artNoteFramework);
    }
    
    // 检查是否有HTML艺术笔记数据
    if (workflowData.artNoteHtml) {
      setArtNoteHtml(workflowData.artNoteHtml);
    } else if (workflowData.fullStudyPlan?.studyPlanId && !artNoteFramework) {
      // 如果有方案ID但没有艺术笔记，尝试生成
      generateArtNoteFramework();
    }
  }, [workflowData]);

  const generateArtNoteFramework = async () => {
    if (!workflowData.fullStudyPlan?.studyPlanId) {
      message.error('缺少研学方案ID，无法生成艺术笔记框架');
      return;
    }

    try {
      setIsGenerating(true);
      
      // 构建艺术笔记生成参数
      const params = {
        noteStyle: 'comprehensive', // 综合型笔记
        includeSketchAreas: true, // 包含绘图区域
        includeReflectionPrompts: true, // 包含反思提示
        gradeLevel: 'mixed', // 混合年级
        focusAreas: ['observation', 'cultural_understanding', 'artistic_expression'], // 关注领域
        templatePreference: 'structured' // 结构化模板
      };

      // 调用后端API生成艺术笔记框架
      const response = await studyPlanApi.generateArtNoteFramework(
        workflowData.fullStudyPlan.studyPlanId!,
        params
      );

      setArtNoteFramework(response);
      
      // 更新工作流数据
      updateWorkflowData({
        artNoteFramework: response
      });
      
      message.success('艺术笔记框架生成完成！');
      
    } catch (error: any) {
      console.error('生成艺术笔记框架失败:', error);
      message.error(error.message || '生成艺术笔记框架失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成HTML格式的艺术笔记
  const generateArtNoteHtml = async () => {
    if (!workflowData.fullStudyPlan?.studyPlanId) {
      message.error('缺少研学方案ID，无法生成HTML艺术笔记');
      return;
    }

    try {
      setIsGeneratingHtml(true);
      
      // 构建HTML艺术笔记生成参数
      const params = {
        styleTheme: "modern",
        includeImages: true,
        includeInteractiveElements: true,
        colorScheme: "blue",
        fontFamily: "Microsoft YaHei"
      };

      // 调用后端API生成HTML艺术笔记
      const response = await studyPlanApi.generateArtNoteHtml(
        workflowData.fullStudyPlan.studyPlanId!,
        params
      );

      if (response && response.htmlContent) {
        setArtNoteHtml(response.htmlContent);
        
        // 更新工作流数据
        updateWorkflowData({
          artNoteHtml: response.htmlContent
        });
        
        message.success('HTML艺术笔记生成完成！');
        // 切换到HTML标签页
        setActiveTab('html');
      } else {
        throw new Error('未获取到HTML内容');
      }
      
    } catch (error: any) {
      console.error('生成HTML艺术笔记失败:', error);
      message.error(error.message || '生成HTML艺术笔记失败，请重试');
    } finally {
      setIsGeneratingHtml(false);
    }
  };

  const handleComplete = async () => {
    try {
      // 更新工作流数据
      updateWorkflowData({
        artNoteFramework: artNoteFramework,
        artNoteHtml: artNoteHtml
      });
      
      message.success('恭喜！智能研学方案已全部完成！');
      
      // 跳转到完成状态
      setTimeout(() => {
        setCurrentStep(5); // 设置为超过最大步骤数，显示完成状态
      }, 1000);
      
    } catch (error) {
      message.error('处理失败，请重试');
    }
  };

  if (isGenerating && isGeneratingHtml) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <h3>AI正在生成艺术笔记...</h3>
          <p style={{ color: '#666' }}>根据您的研学路线和课程规划，智能生成个性化的学习笔记</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <Card 
        title={
          <div>
            <BookOutlined style={{ marginRight: 8 }} />
            智能艺术笔记
          </div>
        }
        className="workflow-step-card"
        variant="outlined"
      >
        {(artNoteFramework || artNoteHtml) ? (
          <div>
            <Alert
              message="艺术笔记生成完成"
              description="AI已基于您的研学方案生成了专业的艺术笔记，包含观察记录、创意活动和反思引导。"
              type="success"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              tabPosition="top"
              style={{ marginBottom: 24 }}
              items={[
                {
                  key: 'framework',
                  label: (
                    <span>
                      <FileTextOutlined />
                      笔记框架
                    </span>
                  ),
                  children: artNoteFramework ? (
                    <div>
                      {/* 显示笔记框架内容 */}
                      <div style={{ marginBottom: 24 }}>
                        <h4>笔记框架概览</h4>
                        
                        {artNoteFramework.frameworkTitle && (
                          <h3 style={{ color: '#1890ff', marginBottom: 16 }}>
                            {artNoteFramework.frameworkTitle}
                          </h3>
                        )}

                        {artNoteFramework.frameworkDescription && (
                          <div style={{ 
                            background: '#f0f9ff', 
                            border: '1px solid #bae7ff', 
                            borderRadius: '8px', 
                            padding: '16px',
                            marginBottom: '16px'
                          }}>
                            {artNoteFramework.frameworkDescription}
                          </div>
                        )}

                        {artNoteFramework.targetLearningOutcomes && (
                          <div style={{ marginBottom: 16 }}>
                            <strong>学习目标：</strong>
                            <div style={{ marginTop: 8 }}>
                              {Array.isArray(artNoteFramework.targetLearningOutcomes) ? (
                                artNoteFramework.targetLearningOutcomes.map((outcome: string, index: number) => (
                                  <Tag key={index} color="blue" style={{ margin: '2px 4px' }}>
                                    {outcome}
                                  </Tag>
                                ))
                              ) : (
                                <span>{artNoteFramework.targetLearningOutcomes}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 笔记章节 */}
                      {artNoteFramework.noteSections && artNoteFramework.noteSections.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                          <h4>笔记章节</h4>
                          <Collapse>
                            {artNoteFramework.noteSections.map((section: any, index: number) => (
                              <Panel 
                                header={
                                  <div>
                                    <BulbOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                    {section.sectionTitle || `第${index + 1}章节`}
                                  </div>
                                } 
                                key={index}
                              >
                                {section.sectionDescription && (
                                  <div style={{ marginBottom: 16, color: '#666' }}>
                                    {section.sectionDescription}
                                  </div>
                                )}

                                {section.observationPrompts && section.observationPrompts.length > 0 && (
                                  <div style={{ marginBottom: 16 }}>
                                    <strong>观察提示：</strong>
                                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                                      {section.observationPrompts.map((prompt: string, idx: number) => (
                                        <li key={idx} style={{ marginBottom: 4 }}>{prompt}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {section.reflectionQuestions && section.reflectionQuestions.length > 0 && (
                                  <div style={{ marginBottom: 16 }}>
                                    <strong>思考问题：</strong>
                                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                                      {section.reflectionQuestions.map((question: string, idx: number) => (
                                        <li key={idx} style={{ marginBottom: 4 }}>{question}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {section.creativeActivities && section.creativeActivities.length > 0 && (
                                  <div style={{ marginBottom: 16 }}>
                                    <strong>创意活动：</strong>
                                    <div style={{ marginTop: 8 }}>
                                      {section.creativeActivities.map((activity: any, idx: number) => (
                                        <div key={idx} style={{ 
                                          background: '#f6f8fa', 
                                          padding: '8px 12px', 
                                          borderRadius: '6px', 
                                          marginBottom: '8px' 
                                        }}>
                                          <strong>{activity.activityTitle || `活动${idx + 1}`}：</strong>
                                          {activity.activityDescription}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {section.sketchAreas && (
                                  <div style={{ marginBottom: 16 }}>
                                    <Tag color="green">包含绘图区域</Tag>
                                    <span style={{ marginLeft: 8, color: '#666' }}>
                                      为学生提供专门的绘画和记录空间
                                    </span>
                                  </div>
                                )}
                              </Panel>
                            ))}
                          </Collapse>
                        </div>
                      )}

                      {/* 使用指南 */}
                      {artNoteFramework.usageGuidelines && (
                        <div style={{ marginBottom: 24 }}>
                          <h4>使用指南</h4>
                          <div style={{ 
                            background: '#f6f8fa', 
                            padding: '12px 16px', 
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}>
                            {Array.isArray(artNoteFramework.usageGuidelines) ? (
                              <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {artNoteFramework.usageGuidelines.map((guideline: string, index: number) => (
                                  <li key={index}>{guideline}</li>
                                ))}
                              </ul>
                            ) : (
                              artNoteFramework.usageGuidelines
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Button
                        type="primary"
                        size="large"
                        onClick={generateArtNoteFramework}
                        loading={isGenerating}
                        icon={<FileTextOutlined />}
                      >
                        生成艺术笔记框架
                      </Button>
                    </div>
                  )
                },
                {
                  key: 'html',
                  label: (
                    <span>
                      <Html5Outlined />
                      HTML笔记
                    </span>
                  ),
                  children: artNoteHtml ? (
                    <div>
                      <div style={{ marginBottom: 20 }}>
                        <Alert
                          message="HTML艺术笔记已生成"
                          description="以下是大模型生成的HTML格式艺术笔记，可直接在浏览器中查看和使用。"
                          type="success"
                          showIcon
                        />
                      </div>
                      
                      <div 
                        style={{ 
                          border: '1px solid #e8e8e8',
                          borderRadius: '8px',
                          padding: '0',
                          background: '#fff',
                          height: '500px',
                          overflow: 'auto'
                        }}
                      >
                        <iframe
                          srcDoc={artNoteHtml}
                          style={{
                            width: '100%',
                            height: '100%',
                            border: 'none'
                          }}
                          title="HTML艺术笔记"
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <Button
                        type="primary"
                        size="large"
                        onClick={generateArtNoteHtml}
                        loading={isGeneratingHtml}
                        icon={<Html5Outlined />}
                      >
                        生成HTML艺术笔记
                      </Button>
                      <p style={{ marginTop: 16, color: '#666' }}>
                        点击生成HTML格式的艺术笔记，可直接在浏览器中查看和使用
                      </p>
                    </div>
                  )
                }
              ]}
            />

            <div style={{ 
              textAlign: 'center',
              padding: '20px',
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: '8px',
              marginBottom: 24
            }}>
              <h4 style={{ color: '#52c41a', marginBottom: 12 }}>🎉 方案生成完成！</h4>
              <p style={{ margin: 0, color: '#52c41a' }}>
                您的智能研学方案已经全部完成，包含教学设计、景点选择、课程规划、路线设计和学习笔记框架。
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              {activeTab === 'framework' && (
                <Button
                  type="default"
                  onClick={generateArtNoteFramework}
                  loading={isGenerating}
                  style={{ marginRight: 12 }}
                >
                  重新生成框架
                </Button>
              )}
              
              {activeTab === 'html' && (
                <Button
                  type="default"
                  onClick={generateArtNoteHtml}
                  loading={isGeneratingHtml}
                  style={{ marginRight: 12 }}
                >
                  重新生成HTML
                </Button>
              )}
              
              {!artNoteHtml && (
                <Button
                  type="primary"
                  onClick={generateArtNoteHtml}
                  loading={isGeneratingHtml}
                  style={{ marginRight: 12 }}
                >
                  生成HTML笔记
                </Button>
              )}
              
              <Button
                type="primary"
                onClick={handleComplete}
                size="large"
                icon={<CheckOutlined />}
                style={{
                  borderRadius: '20px',
                  padding: '0 30px',
                  height: '45px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: '#52c41a',
                  borderColor: '#52c41a'
                }}
              >
                完成方案设计
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Alert
              message="暂无艺术笔记"
              description="未找到生成的艺术笔记，请点击下方按钮生成。"
              type="warning"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <Button
                type="primary"
                size="large"
                onClick={generateArtNoteFramework}
                loading={isGenerating}
                icon={<FileTextOutlined />}
                style={{
                  borderRadius: '20px',
                  padding: '0 30px',
                  height: '45px',
                  fontSize: '16px',
                  fontWeight: 600
                }}
              >
                生成艺术笔记框架
              </Button>
              
              <Button
                type="primary"
                size="large"
                onClick={generateArtNoteHtml}
                loading={isGeneratingHtml}
                icon={<Html5Outlined />}
                style={{
                  borderRadius: '20px',
                  padding: '0 30px',
                  height: '45px',
                  fontSize: '16px',
                  fontWeight: 600,
                  background: '#1890ff',
                  borderColor: '#1890ff'
                }}
              >
                生成HTML艺术笔记
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default NotesStep; 