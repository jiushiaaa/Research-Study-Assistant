import React, { useState } from 'react';
import { Collapse, Radio, Typography, List, Card, Tag, Input, Button, Space, Modal, Tooltip, message } from 'antd';
import { QuestionCircleOutlined, EditOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Title, Paragraph, Text } = Typography;
const { Group, Button: RadioButton } = Radio;
const { TextArea } = Input;

// 定义笔记内容类型
interface NoteQuestion {
  id: string;
  text: string;
}

interface NoteCreativeTopic {
  id: string;
  title: string;
  description: string;
}

interface LandmarkNote {
  landmarkId: string;
  landmarkName: string;
  lowGradeQuestions: NoteQuestion[];
  highGradeQuestions: NoteQuestion[];
  creativeTopics: NoteCreativeTopic[];
}

// 用户笔记类型
interface UserNote {
  id: string;
  landmarkId: string;
  content: string;
  createdAt: string;
}

const NotesFramework: React.FC<{ notes: LandmarkNote[] }> = ({ notes }) => {
  const [gradeLevel, setGradeLevel] = useState<'low' | 'high'>('low');
  const [userNotes, setUserNotes] = useState<Record<string, UserNote[]>>({});
  const [editingNote, setEditingNote] = useState<{landmarkId: string, noteId?: string, content: string} | null>(null);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  
  // 处理年级切换
  const handleGradeChange = (e: any) => {
    setGradeLevel(e.target.value);
  };

  // 打开添加笔记模态框
  const showAddNoteModal = (landmarkId: string) => {
    setEditingNote({
      landmarkId,
      content: ''
    });
    setIsNoteModalVisible(true);
  };

  // 打开编辑笔记模态框
  const showEditNoteModal = (landmarkId: string, noteId: string, content: string) => {
    setEditingNote({
      landmarkId,
      noteId,
      content
    });
    setIsNoteModalVisible(true);
  };

  // 处理笔记内容变更
  const handleNoteContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editingNote) {
      setEditingNote({
        ...editingNote,
        content: e.target.value
      });
    }
  };

  // 保存笔记
  const saveNote = () => {
    if (!editingNote || !editingNote.content.trim()) {
      message.error('笔记内容不能为空');
      return;
    }

    const { landmarkId, noteId, content } = editingNote;
    
    // 获取现有的笔记列表或创建新的
    const existingNotes = userNotes[landmarkId] || [];
    
    if (noteId) {
      // 编辑现有笔记
      const updatedNotes = existingNotes.map(note => 
        note.id === noteId ? { ...note, content, createdAt: new Date().toISOString() } : note
      );
      
      setUserNotes({
        ...userNotes,
        [landmarkId]: updatedNotes
      });
      
      message.success('笔记已更新');
    } else {
      // 创建新笔记
      const newNote: UserNote = {
        id: Math.random().toString(36).substring(2, 10),
        landmarkId,
        content,
        createdAt: new Date().toISOString()
      };
      
      setUserNotes({
        ...userNotes,
        [landmarkId]: [...existingNotes, newNote]
      });
      
      message.success('笔记已添加');
    }
    
    setIsNoteModalVisible(false);
    setEditingNote(null);
  };

  // 删除笔记
  const deleteNote = (landmarkId: string, noteId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条笔记吗？此操作不可撤销。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        const updatedNotes = (userNotes[landmarkId] || []).filter(note => note.id !== noteId);
        
        setUserNotes({
          ...userNotes,
          [landmarkId]: updatedNotes
        });
        
        message.success('笔记已删除');
      }
    });
  };

  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card title="艺术笔记框架" className="notes-card">
      <div className="grade-selector">
        <Group 
          value={gradeLevel} 
          onChange={handleGradeChange}
          buttonStyle="solid"
        >
          <RadioButton value="low">低年级版本</RadioButton>
          <RadioButton value="high">高年级版本</RadioButton>
        </Group>
      </div>
      
      <Collapse accordion className="notes-collapse">
        {notes.map(note => (
          <Panel 
            header={note.landmarkName} 
            key={note.landmarkId}
            extra={
              <Button 
                type="text" 
                icon={<PlusOutlined />} 
                onClick={(e) => {
                  e.stopPropagation();
                  showAddNoteModal(note.landmarkId);
                }}
              >
                添加笔记
              </Button>
            }
          >
            <div className="questions-section">
              <Title level={5}>引导问题</Title>
              <List
                itemLayout="horizontal"
                dataSource={gradeLevel === 'low' ? note.lowGradeQuestions : note.highGradeQuestions}
                renderItem={question => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<QuestionCircleOutlined style={{ fontSize: 18, color: '#1890ff' }} />}
                      title={question.text}
                    />
                  </List.Item>
                )}
              />
            </div>
            
            <div className="creative-topics-section">
              <Title level={5}>创作主题提示</Title>
              <List
                itemLayout="horizontal"
                dataSource={note.creativeTopics}
                renderItem={topic => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<EditOutlined style={{ fontSize: 18, color: '#52c41a' }} />}
                      title={topic.title}
                      description={topic.description}
                    />
                    <Tag color="blue">创作主题</Tag>
                  </List.Item>
                )}
              />
            </div>

            {/* 用户笔记区域 */}
            {(userNotes[note.landmarkId] && userNotes[note.landmarkId].length > 0) && (
              <div className="user-notes-section">
                <Title level={5} style={{ marginTop: 16 }}>我的笔记</Title>
                <List
                  itemLayout="vertical"
                  dataSource={userNotes[note.landmarkId]}
                  renderItem={userNote => (
                    <List.Item
                      className="user-note-item"
                      actions={[
                        <Space>
                          <Tooltip title="编辑">
                            <Button 
                              icon={<EditOutlined />} 
                              type="text" 
                              size="small"
                              onClick={() => showEditNoteModal(note.landmarkId, userNote.id, userNote.content)}
                            />
                          </Tooltip>
                          <Tooltip title="删除">
                            <Button 
                              icon={<DeleteOutlined />} 
                              type="text" 
                              size="small" 
                              danger
                              onClick={() => deleteNote(note.landmarkId, userNote.id)}
                            />
                          </Tooltip>
                        </Space>
                      ]}
                    >
                      <div className="note-content">
                        <div className="note-text">{userNote.content}</div>
                        <div className="note-time">记录于: {formatDate(userNote.createdAt)}</div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </Panel>
        ))}
      </Collapse>

      {/* 添加/编辑笔记模态框 */}
      <Modal
        title={editingNote?.noteId ? "编辑笔记" : "添加笔记"}
        open={isNoteModalVisible}
        onCancel={() => setIsNoteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsNoteModalVisible(false)}>
            取消
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={saveNote}
          >
            保存
          </Button>
        ]}
      >
        <TextArea
          value={editingNote?.content || ''}
          onChange={handleNoteContentChange}
          placeholder="记录您的观察、感想或创作灵感..."
          autoSize={{ minRows: 6, maxRows: 12 }}
          showCount
          maxLength={1000}
        />
      </Modal>
    </Card>
  );
};

export default NotesFramework;
