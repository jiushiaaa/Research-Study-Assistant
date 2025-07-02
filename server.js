const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();
const multer = require('multer');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const WebSocket = require('ws');
const url = require('url');

const app = express();
const port = process.env.PORT || 8080;

// 中间件
app.use(cors());
app.use(express.json());

const upload = multer();

// DeepSeek平台客户端配置
const deepSeekClient = new OpenAI({
  apiKey: "sk-e580e4d0d96d43e3a98244fbc232419e", // 请替换为你的DeepSeek API Key
  baseURL: "https://api.deepseek.com/v1",
});

// 讯飞开放平台配置
const IFLYTEK_APPID = '8d2124c2';
const IFLYTEK_API_SECRET = 'YmY2ZTkwMzNjZDkwM2Y5NjhiMmM5OWQ0';
const IFLYTEK_API_KEY = '6cdf2ad8bbae1c5bc405e6137b5a7fb4';

// 讯飞WebSocket流式语音识别API
// 文档：https://www.xfyun.cn/doc/asr/voicedictation/API.html

function getIflytekWsAuthUrl() {
  const host = 'iat-api.xfyun.cn';
  const path = '/v2/iat';
  const date = new Date().toUTCString();
  
  // 构建签名原始字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
  
  // 使用HMAC-SHA256计算签名
  const signatureSha = crypto.createHmac('sha256', IFLYTEK_API_SECRET).update(signatureOrigin).digest('base64');
  
  // 构建authorization原始字符串
  const authorizationOrigin = `api_key="${IFLYTEK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
  
  // Base64编码authorization
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  
  // 构建查询参数
  const params = new URLSearchParams();
  params.append('authorization', authorization);
  params.append('date', date);
  params.append('host', host);
  
  const wsUrl = `wss://${host}${path}?${params.toString()}`;
  
  console.log('🔐 讯飞WebSocket认证信息:', {
    host,
    path,
    date,
    authorization: authorization.substring(0, 20) + '...',
    wsUrl: wsUrl.substring(0, 80) + '...'
  });
  
  return wsUrl;
}

// API路由 - DeepSeek 聊天接口
app.post('/api/v1/chat/completions', async (req, res) => {
  try {
    console.log('🤖 收到聊天请求:', req.body);
    
    // 检查是否是流式请求
    if (req.body.stream) {
      // 流式响应
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      });

      const stream = await deepSeekClient.chat.completions.create({
        model: req.body.model || "deepseek-chat",
        messages: req.body.messages,
        temperature: req.body.temperature || 0.7,
        max_tokens: req.body.max_tokens || 10000,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      res.end();
      console.log('✅ 流式响应完成');
    } else {
      // 非流式响应
      const response = await deepSeekClient.chat.completions.create({
        model: req.body.model || "deepseek-chat",
        messages: req.body.messages,
        temperature: req.body.temperature || 0.7,
        max_tokens: req.body.max_tokens || 10000,
      });

      console.log('✅ DeepSeek平台响应成功');
      res.json(response);
    }
  } catch (error) {
    console.error('❌ DeepSeek平台调用失败:', error);
    
    if (req.body.stream && !res.headersSent) {
      res.writeHead(500, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
    }
    
    res.status(500).json({
      error: '调用DeepSeek平台失败',
      details: error.message
    });
  }
});

// API路由 - DeepSeek模型列表
app.get('/api/v1/models', async (req, res) => {
  try {
    const response = await deepSeekClient.models.list();
    res.json(response);
  } catch (error) {
    console.error('❌ 获取DeepSeek模型列表失败:', error);
    res.status(500).json({
      error: '获取DeepSeek模型列表失败',
      details: error.message
    });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/iflytek/speech', upload.single('audio'), async (req, res) => {
  try {
    console.log('🎤 收到语音识别请求');
    
    if (!req.file) {
      return res.status(400).json({ error: '未收到音频文件' });
    }
    
    console.log('📁 音频文件信息:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // 获取WebSocket认证URL
    const wsUrl = getIflytekWsAuthUrl();
    
    // 创建WebSocket连接
    const ws = new WebSocket(wsUrl);
    
    let transcript = '';
    let isComplete = false;
    
    // 设置超时
    const timeout = setTimeout(() => {
      if (!isComplete) {
        console.error('❌ WebSocket超时');
        ws.close();
        if (!res.headersSent) {
          res.status(500).json({ error: 'WebSocket连接超时' });
        }
      }
    }, 10000);
    
    ws.on('open', () => {
      console.log('✅ WebSocket连接已建立');
      
      // 发送第一帧数据（包含参数）
      const audioBase64 = req.file.buffer.toString('base64');
      
      const firstFrame = {
        common: {
          app_id: IFLYTEK_APPID
        },
        business: {
          language: 'zh_cn',
          domain: 'iat',
          accent: 'mandarin',
          vad_eos: 2000,
          dwa: 'wpgs' // 开启流式结果返回
        },
        data: {
          status: 0, // 第一帧
          format: 'audio/L16;rate=16000',
          encoding: 'raw',
          audio: audioBase64
        }
      };
      
      console.log('📤 发送第一帧数据');
      ws.send(JSON.stringify(firstFrame));
      
      // 发送结束标识
      setTimeout(() => {
        const endFrame = {
          data: {
            status: 2 // 最后一帧
          }
        };
        console.log('📤 发送结束标识');
        ws.send(JSON.stringify(endFrame));
      }, 100);
    });
    
    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());
        console.log('📥 收到WebSocket响应:', response);
        
        if (response.code !== 0) {
          console.error('❌ 讯飞API返回错误:', response);
          clearTimeout(timeout);
          if (!res.headersSent) {
            res.status(500).json({ 
              error: '讯飞语音识别失败', 
              code: response.code,
              message: response.message 
            });
          }
          ws.close();
          return;
        }
        
        if (response.data && response.data.result && response.data.result.ws) {
          // 解析识别结果
          const words = response.data.result.ws.map(item => 
            item.cw.map(word => word.w).join('')
          ).join('');
          
          transcript += words;
          console.log('🔍 当前识别结果:', transcript);
        }
        
        // 检查是否是最后一片结果
        if (response.data && response.data.status === 2) {
          isComplete = true;
          clearTimeout(timeout);
          
          console.log('✅ 语音识别完成:', transcript);
          if (!res.headersSent) {
            res.json({ 
              transcript: transcript.trim(), 
              confidence: 0.9 
            });
          }
          ws.close();
        }
      } catch (e) {
        console.error('❌ 解析WebSocket响应失败:', e);
        clearTimeout(timeout);
        if (!res.headersSent) {
          res.status(500).json({ error: '解析响应失败', details: e.message });
        }
        ws.close();
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket连接错误:', error);
      clearTimeout(timeout);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'WebSocket连接失败', 
          details: error.message 
        });
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket连接关闭: ${code} - ${reason}`);
      clearTimeout(timeout);
      if (!isComplete && !res.headersSent) {
        res.status(500).json({ error: 'WebSocket连接意外关闭' });
      }
    });
    
  } catch (error) {
    console.error('❌ 讯飞语音识别失败:', error);
    res.status(500).json({ 
      error: '讯飞语音识别失败', 
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 后端服务器运行在端口 ${port}`);
  console.log(`📡 API端点: http://localhost:${port}/api/v1`);
}); 