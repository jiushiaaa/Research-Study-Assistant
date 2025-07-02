import React, { useState, useRef } from 'react';
import './NewPage.css';
import MainWorkflow from '../components/MainWorkflow';
import { useNavigate } from 'react-router-dom';
import { AiChatDialog } from '../components/AiChat';

// 原有景点图片
const siteTips = [
  { name: '好好栗子', x: 340, y: 270, imgSrc: '/site/1.png' },
  { name: '虹口糕团', x: 280, y: 40, imgSrc: '/site/2.png' },
  { name: '牛肉包', x: 445, y: 240, imgSrc: '/site/3.png' },
  { name: '汤圆', x: 490, y: 110, imgSrc: '/site/5.png' },
  { name: '甜爱路', x: 410, y: 10, imgSrc: '/site/6.png' },
  { name: '万寿斋', x: 330, y: 150, imgSrc: '/site/7.png' },
  { name: '左联', x: 39, y: 110, imgSrc: '/site/8.png' },
  { name: '石库门', x: 60, y: 240, imgSrc: '/site/4.png' },
];
// /tips 目录下的颜色图钉
const colorTips = [
  { name: 'blue', x: 120, y: 250 },
  { name: 'blue1', x: 460, y: 180 },
  { name: 'pink', x: 150, y: 150 },
  { name: 'pink1', x: 310, y: 220 },
  { name: 'green', x: 90, y: 180 },
  { name: 'green1', x: 530, y: 295 },
  { name: 'brown', x: 190, y: 235 },
  { name: 'brown1', x: 320, y: 330 },
  { name: 'red', x: 116, y: 160 },
  { name: 'red1', x: 500, y: 40 },
  { name: 'yellow', x: 116, y: 70 },
  { name: 'yellow1', x: 260, y: 100 },
];
const tips = [
  ...siteTips,
  ...colorTips.map(tip => ({
    ...tip,
    imgSrc: `/tips/${tip.name}.png`
  }))
];

const presetQuestions = [
  (name: string) => `你能向我介绍一下${name}吗？`,
  (name: string) => `${name}有哪些特色美食？`,
  (name: string) => `${name}有怎样的历史文化特色？`,
];

const NewPage: React.FC = () => {
  const [selectedTip, setSelectedTip] = useState<null | typeof tips[0]>(null);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiChatLocation, setAiChatLocation] = useState<string>('');
  const [aiChatInitialQuestion, setAiChatInitialQuestion] = useState<string>('');



  const handleAsk = async (question: string) => {
    // 打开AI对话框
    setAiChatLocation(selectedTip?.name || '');
    setAiChatInitialQuestion(question);
    setShowAiChat(true);
  };

  // 处理语音输入（用于地图上的景点）
  const handleVoiceInputForLocation = () => {
    if (selectedTip) {
      setAiChatLocation(selectedTip.name);
      setAiChatInitialQuestion('');
      setShowAiChat(true);
    }
  };

  // 处理通用语音输入
  const handleGeneralVoiceInput = () => {
    setAiChatLocation('');
    setAiChatInitialQuestion('');
    setShowAiChat(true);
  };

  // 处理通用文字输入
  const handleGeneralTextInput = () => {
    setAiChatLocation('');
    setAiChatInitialQuestion('');
    setShowAiChat(true);
  };

  const handleClose = () => {
    setSelectedTip(null);
  };

  return (
    <div className="newpage-container">
      {/* 智能研学助手按钮 */}
      

      {/* 工作流模态框 */}
      {showWorkflow && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowWorkflow(false)}
        >
          <div
            style={{
              width: '90%',
              height: '90%',
              background: 'white',
              borderRadius: 16,
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowWorkflow(false)}
              style={{
                position: 'absolute',
                top: 15,
                right: 15,
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: '#999',
                zIndex: 2001,
              }}
            >
              ×
            </button>
            <MainWorkflow />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2.4rem', fontWeight: 800, color: '#fff', letterSpacing: 2, marginBottom: 32, marginTop: 32, textShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
          小道新貌研学创作助手
        </h1>
        <div style={{ position: 'relative', width: 600, height: 400 }}>
          {/* 底图 */}
          <img src="/map.png" alt="地图" style={{ width: '100%', height: '100%', borderRadius: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }} />
          {/* tips.png 透明层 */}


          {/* 可交互的图片按钮 */}
          {tips.filter(tip => tip.imgSrc).map(tip => (
            <img
              key={tip.name}
              src={tip.imgSrc}
              alt={tip.name}
              style={{
                position: 'absolute',
                left: tip.x,
                top: tip.y,
                width:
                  tip.name === '左联' ? 60 :
                  tip.name === '石库门' ? 60 :
                  tip.imgSrc.startsWith('/site/') ? 110 : 40,
                height:
                  tip.name === '左联' ? 60 :
                  tip.name === '石库门' ? 60 :
                  tip.imgSrc.startsWith('/site/') ? 110 : 40,
                objectFit: 'contain',
                cursor: 'pointer',
                zIndex: 3,
                transition: 'transform 0.2s ease',
                transform: selectedTip?.name === tip.name ? 'scale(1.15)' : 'scale(1)',
                filter: selectedTip?.name === tip.name ? 'drop-shadow(0 0 10px #fff)' : 'none',
              }}
              onClick={() => {
                setSelectedTip(tip);
              }}
              title={tip.name}
            />
          ))}

          

          {/* 信息介绍框 */}
          {selectedTip && (
            <div style={{ position: 'absolute', left: selectedTip.x + 40 > 550 ? selectedTip.x - 240 : selectedTip.x + 40, top: selectedTip.y, width: 220, background: 'rgba(255,255,255,0.98)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.13)', padding: 16, zIndex: 20, border: '1px solid #eee', animation: 'fadeIn 0.4s' }}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{selectedTip.name}</div>
              {/* Image preview in popup */}
              <img src={selectedTip.imgSrc} alt={selectedTip.name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8, background: '#f6f6f6' }} onError={e => (e.currentTarget.style.display = 'none')} />
              {/* 预设问题 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {presetQuestions.map((fn, i) => (
                  <button key={i} style={{ background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 13 }} onClick={() => handleAsk(fn(selectedTip.name))}>
                    {fn(selectedTip.name)}
                  </button>
                ))}
                <button
                  style={{
                    background: '#f0f5ff',
                    border: '1px solid #adc6ff',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                  onClick={handleVoiceInputForLocation}
                >
                  语音提问
                </button>
              </div>
              <div style={{ textAlign: 'right' }}>
                <button style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 12 }} onClick={handleClose}>
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="newpage-card" style={{ marginTop: 32, width: 600 }}>
          <div className="newpage-content" style={{ minHeight: 60, fontSize: 16, textAlign: 'center' }}>
            点击景点输入问题哦
          </div>
          {/* 新增：下方两个按钮 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 24 }}>
            <button
              style={{
                flex: 1,
                height: 48,
                border: '2px solid #adc6ff',
                borderRadius: 12,
                background: '#f0f5ff',
                color: '#3056d3',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={handleGeneralVoiceInput}
            >
              语音输入
            </button>
            <button
              style={{
                flex: 1,
                height: 48,
                border: '2px solid #adc6ff',
                borderRadius: 12,
                background: '#fff',
                color: '#3056d3',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={handleGeneralTextInput}
            >
              打字输入
            </button>
          </div>
        </div>
      </div>

      {/* AI对话框 */}
      <AiChatDialog
        visible={showAiChat}
        onClose={() => setShowAiChat(false)}
        locationName={aiChatLocation}
        initialQuestion={aiChatInitialQuestion}
      />
    </div>
  );
};

export default NewPage;
