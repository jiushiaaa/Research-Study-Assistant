import React, { useState, useEffect } from 'react';
import { Select, Card, Tag, Button, Modal, Spin, Row, Col } from 'antd';
import { useImageFetching } from '../services/imageService';
import LocationImageDisplay from '../components/LocationImageDisplay';

const { Option } = Select;

interface Landmark {
  id: string;
  title: string;
  type: string;
  description: string;
  location: string;
  duration: string;
  grades: string[];
  focusPoints: string[];
  imageUrls: string[];
}

// 景点数据
const LANDMARKS: Landmark[] = [
  {
    id: '1',
    title: '多伦路文化名人街',
    type: '历史文化',
    description: '多伦路文化名人街是上海市著名的历史文化街区，曾是"文化人"的聚集地，鲁迅、郭沫若等文化名人都曾在此居住。',
    location: '上海市虹口区多伦路',
    duration: '约1-2小时',
    grades: ['小学高年级', '初中', '高中'],
    focusPoints: ['近代文学史', '建筑特色', '名人故事'],
    imageUrls: [
      'https://store.is.autonavi.com/showpic/322d5c37cb6c19ca350846eac470fbef'
    ]
  },
  {
    id: '2',
    title: '鲁迅公园与墓',
    type: '人文景观',
    description: '鲁迅公园是为纪念文学家鲁迅而建的纪念性公园，园内有鲁迅墓、鲁迅纪念馆等。鲁迅先生是中国现代文学的奠基人。',
    location: '上海市虹口区四川北路2288号',
    duration: '约2小时',
    grades: ['小学高年级', '初中', '高中'],
    focusPoints: ['鲁迅生平', '现代文学', '爱国主义教育'],
    imageUrls: [
      'https://store.is.autonavi.com/showpic/dbba34f11f84640dc5a7956c86392d62'
    ]
  },
  {
    id: '3',
    title: '1933老场坊',
    type: '工业遗址',
    description: '1933老场坊前身是上海工部局宰牲场，建于1933年，是一座具有独特建筑风格的混凝土建筑，现已改造为创意产业园区。',
    location: '上海市虹口区沙泾路10号',
    duration: '约3小时',
    grades: ['初中', '高中'],
    focusPoints: ['近代工业建筑', '空间结构设计', '城市更新与再利用'],
    imageUrls: [
      'https://store.is.autonavi.com/showpic/250ed19cd39e98c1dd9baa9b87f433e1'
    ]
  }
];

const LandmarksPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<string>('全部类型');
  const [gradeFilter, setGradeFilter] = useState<string>('全部年级');
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 使用自定义Hook从高德地图获取景点图片
  const { 
    images: landmarkImages, 
    loading: imagesLoading, 
    error: imagesError 
  } = useImageFetching(
    selectedLandmark?.title || '', 
    selectedLandmark?.location || '', 
    selectedLandmark?.imageUrls || []
  );
  
  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
  };

  const handleGradeChange = (value: string) => {
    setGradeFilter(value);
  };

  const handleViewDetails = (landmark: Landmark) => {
    setSelectedLandmark(landmark);
    setModalVisible(true);
  };
  
  const handleModalClose = () => {
    setModalVisible(false);
  };

  const filteredLandmarks = LANDMARKS.filter(landmark => {
    const matchesType = typeFilter === '全部类型' || landmark.type === typeFilter;
    const matchesGrade = gradeFilter === '全部年级' || landmark.grades.includes(gradeFilter);
    return matchesType && matchesGrade;
  });

  return (
    <div className="page-container">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ 
          fontSize: '28px', 
          fontWeight: 700, 
          color: '#333',
          marginBottom: 8,
          textAlign: 'center'
        }}>
          虹口区研学景点
        </h2>
        <p style={{ 
          textAlign: 'center', 
          color: '#666', 
          fontSize: '16px',
          marginBottom: 0
        }}>
          探索虹口区丰富的文化遗产和历史景观
        </p>
      </div>
      
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Select 
          style={{ width: 150, marginRight: 16 }} 
          value={typeFilter}
          onChange={handleTypeChange}
          size="large"
        >
          <Option value="全部类型">全部类型</Option>
          <Option value="历史文化">历史文化</Option>
          <Option value="人文景观">人文景观</Option>
          <Option value="工业遗址">工业遗址</Option>
        </Select>
        
        <Select 
          style={{ width: 150 }} 
          value={gradeFilter}
          onChange={handleGradeChange}
          size="large"
        >
          <Option value="全部年级">全部年级</Option>
          <Option value="小学低年级">小学低年级</Option>
          <Option value="小学高年级">小学高年级</Option>
          <Option value="初中">初中</Option>
          <Option value="高中">高中</Option>
        </Select>
      </div>
      
      <Row gutter={[24, 24]}>
        {filteredLandmarks.map(landmark => (
          <Col xs={24} sm={12} lg={8} key={landmark.id}>
            <Card 
              className="landmark-card" 
              hoverable
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease',
                border: 'none'
              }}
              bodyStyle={{ padding: 0 }}
              cover={
                <LocationImageDisplay
                  imageUrls={landmark.imageUrls}
                  locationName={landmark.title}
                  height={240}
                  showPreview={false}
                  showCarousel={true}
                  showBadge={true}
                  autoPlay={false}
                  className="card-image"
                />
              }
            >
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{ 
                    fontSize: '18px',
                    fontWeight: 600,
                    margin: '0 0 8px 0',
                    color: '#333'
                  }}>
                    {landmark.title}
                  </h3>
                  <Tag 
                    color="blue" 
                    style={{ 
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500
                    }}
                  >
                    {landmark.type}
                  </Tag>
                </div>
                
                <p style={{ 
                  color: '#666',
                  marginBottom: 16,
                  lineHeight: '1.5',
                  fontSize: '14px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {landmark.description}
                </p>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8, fontSize: '13px', color: '#666' }}>
                    📍 {landmark.location}
                  </div>
                  <div style={{ marginBottom: 8, fontSize: '13px', color: '#666' }}>
                    ⏱️ 建议游览时间: {landmark.duration}
                  </div>
                  <div style={{ marginBottom: 8, fontSize: '13px', color: '#666' }}>
                    👨‍👩‍👧‍👦 适合年级: {landmark.grades.join(', ')}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: 8 }}>
                    🏛️ 教学重点:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {landmark.focusPoints.map(point => (
                      <Tag 
                        key={point} 
                        style={{ 
                          margin: 0,
                          fontSize: '11px',
                          borderRadius: '8px',
                          background: '#f0f2f5',
                          border: '1px solid #d9d9d9',
                          color: '#666'
                        }}
                      >
                        {point}
                      </Tag>
                    ))}
                  </div>
                </div>
                
                <Button 
                  type="primary" 
                  style={{ 
                    width: '100%', 
                    height: '40px',
                    borderRadius: '20px',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(24, 144, 255, 0.3)'
                  }}
                  onClick={() => handleViewDetails(landmark)}
                >
                  查看详情
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={
          <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 600 }}>
            {selectedLandmark?.title}
          </div>
        }
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={900}
        style={{ top: 20 }}
      >
        {selectedLandmark && (
          <div>
            <div style={{ marginBottom: 32 }}>
              {imagesLoading ? (
                <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Spin size="large">
                    <div style={{ padding: '20px' }}>从高德地图加载景点图片中...</div>
                  </Spin>
                </div>
              ) : (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>
                    景点图片 
                    <span style={{ fontSize: 14, fontWeight: 'normal', color: 'rgba(0,0,0,0.45)' }}>
                      (来自高德地图)
                    </span>
                  </h3>
                  
                  <LocationImageDisplay
                    imageUrls={landmarkImages}
                    locationName={selectedLandmark.title}
                    height={300}
                    showPreview={true}
                    showCarousel={true}
                    showBadge={true}
                    autoPlay={true}
                    className="modal-image-display"
                  />
                  
                  <div style={{ marginTop: 12, color: 'rgba(0,0,0,0.45)', fontSize: 12, textAlign: 'center' }}>
                    点击图片可放大查看，支持左右滑动浏览所有图片
                  </div>
                  {imagesError && (
                    <div style={{ color: '#ff4d4f', marginTop: 8, textAlign: 'center' }}>
                      获取图片失败，请稍后重试。
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 12 }}>景点介绍</h3>
              <p style={{ lineHeight: '1.6', color: '#666' }}>{selectedLandmark.description}</p>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 12 }}>基本信息</h3>
              <div style={{ background: '#f8f9fa', padding: 16, borderRadius: 8 }}>
                <p style={{ margin: '8px 0', color: '#666' }}>📍 位置: {selectedLandmark.location}</p>
                <p style={{ margin: '8px 0', color: '#666' }}>⏱️ 建议游览时间: {selectedLandmark.duration}</p>
                <p style={{ margin: '8px 0', color: '#666' }}>👨‍👩‍👧‍👦 适合年级: {selectedLandmark.grades.join(', ')}</p>
              </div>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 12 }}>教学重点</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {selectedLandmark.focusPoints.map(point => (
                  <Tag 
                    key={point} 
                    color="blue" 
                    style={{ 
                      margin: 0,
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 500
                    }}
                  >
                    {point}
                  </Tag>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 12 }}>相关课程</h3>
              <div style={{ 
                background: '#fff7e6', 
                padding: 16, 
                borderRadius: 8,
                border: '1px solid #ffd591'
              }}>
                <p style={{ margin: 0, color: '#ad6800' }}>
                  这里可以展示与该景点相关的课程内容和教学建议...
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LandmarksPage; 