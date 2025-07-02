const express = require('express');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = 8080;

// 中间件
app.use(cors());
app.use(express.json());
const upload = multer();

// 讯飞配置
const IFLYTEK_APPID = '8d2124c2';
const IFLYTEK_API_SECRET = 'YmY2ZTkwMzNjZDkwM2Y5NjhiMmM5OWQ0';
const IFLYTEK_API_KEY = '6cdf2ad8bbae1c5bc405e6137b5a7fb4';

function getIflytekAuthUrl() {
  const host = 'iat-api.xfyun.cn';
  const uri = '/v1/service/v1/iat';
  const date = new Date().toUTCString();
  const signatureOrigin = `host: ${host}\ndate: ${date}\nPOST ${uri} HTTP/1.1`;
  const signatureSha = crypto.createHmac('sha256', IFLYTEK_API_SECRET).update(signatureOrigin).digest('base64');
  const authorizationOrigin = `api_key="${IFLYTEK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  
  return {
    url: `https://${host}${uri}`,
    headers: {
      'Authorization': authorization,
      'Date': date,
      'Host': host,
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
    }
  };
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 讯飞语音识别
app.post('/api/iflytek/speech', upload.single('audio'), async (req, res) => {
  try {
    console.log('🎤 收到语音识别请求');
    
    if (!req.file) {
      return res.status(400).json({ error: '未收到音频文件' });
    }
    
    const audioBase64 = req.file.buffer.toString('base64');
    const { url, headers } = getIflytekAuthUrl();
    
    const params = new URLSearchParams();
    params.append('appid', IFLYTEK_APPID);
    params.append('language', 'zh_cn');
    params.append('domain', 'iat');
    params.append('accent', 'mandarin');
    params.append('format', 'audio/L16;rate=16000');
    params.append('encoding', 'raw');
    params.append('audio', audioBase64);
    
    console.log('📤 发送到讯飞API:', url);
    
    const response = await axios.post(url, params.toString(), { headers, timeout: 10000 });
    
    console.log('📥 讯飞API响应:', response.status);
    
    if (response.data && response.data.data && response.data.data.result) {
      const result = response.data.data.result;
      let transcript = '';
      
      try {
        if (typeof result === 'string') {
          const json = JSON.parse(result);
          transcript = json.ws.map(w => w.cw.map(c => c.w).join('')).join('');
        } else {
          transcript = result;
        }
      } catch (e) {
        transcript = result;
      }
      
      console.log('✅ 语音识别成功:', transcript);
      res.json({ transcript, confidence: 0.9 });
    } else {
      res.status(500).json({ error: '讯飞API无有效返回', raw: response.data });
    }
  } catch (error) {
    console.error('❌ 讯飞语音识别失败:', error.response?.data || error.message);
    res.status(500).json({ 
      error: '讯飞语音识别失败', 
      details: error.response?.data || error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 测试服务器运行在端口 ${port}`);
}); 