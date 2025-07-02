import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Breadcrumb } from 'antd';
import { HomeOutlined, BookOutlined } from '@ant-design/icons';
import NotesFramework from '../components/Notes/NotesFramework';
import DocumentDownload from '../components/Notes/DocumentDownload';

const { Title } = Typography;

// 模拟数据 - 研学笔记框架
const MOCK_NOTES = [
  {
    landmarkId: 'landmark1',
    landmarkName: '多伦路文化名人街',
    lowGradeQuestions: [
      { id: 'q1', text: '你看到了哪些颜色？' },
      { id: 'q2', text: '这条街道和你的学校附近有什么不同？' },
      { id: 'q3', text: '你最喜欢哪栋建筑？为什么？' }
    ],
    highGradeQuestions: [
      { id: 'q4', text: '这条街道的建筑风格有哪些特点？' },
      { id: 'q5', text: '这里曾经住过哪些文化名人？他们有什么贡献？' },
      { id: 'q6', text: '如何评价这条街道的文化保护工作？' }
    ],
    creativeTopics: [
      { id: 'c1', title: '速写：今潮8弄新旧融合', description: '尝试用速写的方式记录新旧建筑的对比' },
      { id: 'c2', title: '想象对话：与鲁迅的一次交谈', description: '如果你能与鲁迅对话，你会问什么？' }
    ]
  },
  {
    landmarkId: 'landmark2',
    landmarkName: '鲁迅公园与墓',
    lowGradeQuestions: [
      { id: 'q7', text: '公园里有哪些植物？' },
      { id: 'q8', text: '你在参观过程中有什么感受？' },
      { id: 'q9', text: '为什么人们要纪念鲁迅？' }
    ],
    highGradeQuestions: [
      { id: 'q10', text: '鲁迅墓的设计有什么特点？它传达了什么信息？' },
      { id: 'q11', text: '结合参观体验，谈谈鲁迅对中国现代文学的贡献' },
      { id: 'q12', text: '如何理解鲁迅"横眉冷对千夫指"的精神？' }
    ],
    creativeTopics: [
      { id: 'c3', title: '写一篇观后感', description: '结合展览内容，写下你的感想和思考' },
      { id: 'c4', title: '诗歌创作：致敬文学大师', description: '尝试创作一首诗歌，表达对鲁迅的敬意' }
    ]
  }
];

const NotesPage: React.FC = () => {
  // 在实际应用中，这些数据应该从API获取
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [routeId, setRouteId] = useState('route1');
  
  return (
    <div className="page-container">
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
          <span>首页</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <BookOutlined />
          <span>艺术笔记</span>
        </Breadcrumb.Item>
      </Breadcrumb>

      <Title level={2}>艺术笔记与文档</Title>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <NotesFramework notes={notes} />
        </Col>
        
        <Col xs={24} lg={8}>
          <DocumentDownload routeId={routeId} />
        </Col>
      </Row>
    </div>
  );
};

export default NotesPage;
