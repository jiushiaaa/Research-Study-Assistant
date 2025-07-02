import React, { useState, useEffect } from 'react';
import { Card, Button, message, Spin, Timeline, Tag, Alert, Row, Col } from 'antd';
import { ArrowRightOutlined, BulbOutlined, ClockCircleOutlined, EnvironmentOutlined, BookOutlined } from '@ant-design/icons';
import { useWorkflow } from '../WorkflowContext';

const PlanGeneratorStep: React.FC = () => {
  const { nextStep, updateWorkflowData, workflowData } = useWorkflow();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 检查是否已有生成的课程方案
    if (!workflowData.fullStudyPlan) {
      message.warning('未找到生成的研学方案，请返回重新生成');
    }
  }, [workflowData.fullStudyPlan]);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // 更新工作流数据，确认课程规划
      updateWorkflowData({
        coursePlan: workflowData.fullStudyPlan
      });
      
      message.success('课程规划确认完成，正在生成优化路线...');
      
      // 进入下一步
      setTimeout(() => {
        nextStep();
      }, 1000);
      
    } catch (error) {
      message.error('处理失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const studyPlan = workflowData.fullStudyPlan;
  const selectedLocations = workflowData.selectedLocations || [];

  if (!studyPlan) {
    return (
      <div style={{ padding: '20px 0' }}>
        <Alert
          message="缺少课程数据"
          description="未找到生成的研学方案，请返回重新生成。"
          type="warning"
          showIcon
        />
      </div>
    );
  }

  // 格式化课程条目数据
  const planItems = studyPlan.planItems || [];
  
  // 计算总时长：景点数量 * 45分钟
  const totalDurationMinutes = selectedLocations.length * 45;
  const durationDescription = totalDurationMinutes >= 60 
    ? `${Math.floor(totalDurationMinutes / 60)}小时${totalDurationMinutes % 60 > 0 ? totalDurationMinutes % 60 + '分钟' : ''}`
    : `${totalDurationMinutes}分钟`;

  const coursePlanInfo = {
    title: studyPlan.planName || '虹口区研学课程方案',
    theme: studyPlan.themeZh || '文化探索',
    targetAudience: studyPlan.targetAudienceDescription || '学生群体',
    duration: durationDescription,
    objectives: studyPlan.overallLearningObjectives || '提升文化素养和历史认知'
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <Card 
        title={
          <div>
            <BulbOutlined style={{ marginRight: 8 }} />
            智能课程规划方案
          </div>
        }
        className="workflow-step-card"
        variant="outlined"
      >
        <Alert
          message="AI方案生成完成"
          description={`基于您的教学要求"${workflowData.teacherPrompt}"，AI已为您生成了专业的研学课程方案。`}
          type="success"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ color: '#1890ff', marginBottom: 8 }}>{coursePlanInfo.title}</h3>
          
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <div style={{ background: '#f6f8fa', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                <strong>主题：</strong> {coursePlanInfo.theme}
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#f6f8fa', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                <strong>目标群体：</strong> {coursePlanInfo.targetAudience}
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: '#f6f8fa', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                <strong>预计时长：</strong> {coursePlanInfo.duration}
              </div>
            </Col>
          </Row>
          
          <div style={{ marginBottom: 16 }}>
            <Tag icon={<ClockCircleOutlined />} color="blue">
              总时长：{coursePlanInfo.duration}
            </Tag>
            <Tag icon={<EnvironmentOutlined />} color="green">
              景点数量：{selectedLocations.length}个
            </Tag>
            <Tag icon={<BookOutlined />} color="orange">
              课程条目：{selectedLocations.length}个
            </Tag>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4>学习目标</h4>
          <div style={{ 
            background: '#f0f9ff', 
            border: '1px solid #bae7ff', 
            borderRadius: '8px', 
            padding: '16px' 
          }}>
            {coursePlanInfo.objectives}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h4>课程安排</h4>
          {planItems && planItems.length > 0 ? (
            <Timeline
              items={planItems.map((item: any, index: number) => ({
                key: item.id,
                dot: <BulbOutlined style={{ fontSize: 16 }} />,
                color: "blue",
                children: (
                  <div>
                    <h5 style={{ marginBottom: 8 }}>
                      第{item.itemOrder}课时：{item.locationName || `景点${index + 1}`}
                    </h5>
                    <p style={{ color: '#666', marginBottom: 8 }}>
                      📍 地点：{item.locationName} | ⏱️ 时长：{item.estimatedDurationMinutes}分钟
                    </p>
                    
                    {item.teachingContentSummary && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>教学内容：</strong>
                        <div style={{ 
                          background: '#f6f8fa', 
                          padding: '8px 12px', 
                          borderRadius: '6px', 
                          marginTop: '4px',
                          fontSize: '14px'
                        }}>
                          {item.teachingContentSummary}
                        </div>
                      </div>
                    )}
                    
                    {item.activityDescription && (
                      <div style={{ marginBottom: 8 }}>
                        <strong>活动描述：</strong>
                        <div style={{ 
                          background: '#f0f9ff', 
                          padding: '8px 12px', 
                          borderRadius: '6px', 
                          marginTop: '4px',
                          fontSize: '14px'
                        }}>
                          {item.activityDescription}
                        </div>
                      </div>
                    )}
                    
                    {item.urbanLivingRoomFocus && (
                      <div style={{ marginBottom: 8 }}>
                        <Tag color="purple">都市客厅重点：{item.urbanLivingRoomFocus}</Tag>
                      </div>
                    )}
                  </div>
                )
              }))}
            />
          ) : selectedLocations.length > 0 ? (
            <Timeline
              items={selectedLocations.map((location: any, index: number) => ({
                key: location.id,
                dot: <BulbOutlined style={{ fontSize: 16 }} />,
                color: "blue",
                children: (
                  <div>
                    <h5 style={{ marginBottom: 8 }}>
                      第{index + 1}课时：{location.nameZh}
                    </h5>
                    <p style={{ color: '#666', marginBottom: 8 }}>
                      📍 地点：{location.nameZh} | ⏱️ 时长：45分钟
                    </p>
                    
                    <div style={{ marginBottom: 8 }}>
                      <strong>教学内容：</strong>
                      <div style={{ 
                        background: '#f6f8fa', 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        marginTop: '4px',
                        fontSize: '14px'
                      }}>
                        暂无详细教学内容，请生成方案后查看
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: 8 }}>
                      <strong>活动描述：</strong>
                      <div style={{ 
                        background: '#f0f9ff', 
                        padding: '8px 12px', 
                        borderRadius: '6px', 
                        marginTop: '4px',
                        fontSize: '14px'
                      }}>
                        暂无详细活动描述，请生成方案后查看
                      </div>
                    </div>
                  </div>
                )
              }))}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>暂无详细课程安排，将在后续步骤中优化</p>
            </div>
          )}
        </div>

        {selectedLocations.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h4>已选择的研学景点</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {selectedLocations.map(location => (
                <Tag key={location.id} color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                  {location.nameZh}
                </Tag>
              ))}
            </div>
          </div>
        )}

        <div style={{ 
          textAlign: 'center',
          padding: '16px',
          background: '#f6f8fa',
          borderRadius: '8px',
          marginBottom: 24
        }}>
          <p style={{ margin: 0, color: '#52c41a', fontWeight: 500 }}>
            ✨ AI已为您生成专业的课程规划方案！如果满意请点击确认继续。
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            loading={isLoading}
            onClick={handleSubmit}
            icon={!isLoading && <ArrowRightOutlined />}
            style={{
              borderRadius: '20px',
              padding: '0 30px',
              height: '45px',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            {isLoading ? '正在处理...' : '确认课程规划并继续'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PlanGeneratorStep; 