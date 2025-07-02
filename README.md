# 小道新茂研学创作助手

> 基于AI大模型的智能研学创作平台，专注于上海虹口区文化景点的智能导览和研学内容创作。

## 📋 项目概述

小道新茂研学创作助手是一个现代化的Web应用，结合了AI大模型、语音识别、地图交互等技术，为用户提供智能的文化旅游导览服务。项目以上海虹口区的文化景点为核心，通过AI助手为用户提供专业、详细的景点介绍和文化内涵解读。

### 🎯 核心功能

- **智能AI对话**：基于百度千帆平台ERNIE 4.5 Turbo 128k模型
- **语音识别**：支持中文语音转文字输入
- **地图交互**：虹口区景点地图点击交互
- **流式响应**：实时打字效果的AI回复
- **多轮对话**：保持对话上下文的连续交流
- **响应式设计**：适配桌面端和移动端

## 🏗️ 技术架构

### 前端技术栈
- **React 18** - 现代化前端框架
- **TypeScript** - 类型安全的JavaScript
- **Ant Design 5** - 企业级UI组件库
- **React Router 7** - 前端路由管理
- **Web Speech API** - 浏览器原生语音识别

### 后端技术栈
- **Node.js** - JavaScript运行时
- **Express 5** - Web应用框架
- **OpenAI SDK** - 兼容百度千帆平台的SDK
- **CORS** - 跨域资源共享

### AI服务
- **百度千帆平台** - 大模型API服务
- **ERNIE 4.5 Turbo 128k** - 主要使用的AI模型
- **流式响应** - Server-Sent Events实现

## 🚀 快速开始

### 环境要求
- Node.js 16+
- npm 8+
- 现代浏览器（推荐Chrome或Edge）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd v1
```

2. **安装依赖**
```bash
npm install
```

3. **启动后端服务器**
```bash
# 新开一个终端窗口
node server.js
```
后端服务器将运行在 http://localhost:8080

4. **启动前端开发服务器**
```bash
# 在另一个终端窗口
npm start
```
前端应用将运行在 http://localhost:3000

### 访问地址
- **主应用**: http://localhost:3000
- **AI测试页面**: http://localhost:3000/ai-test
- **语音测试页面**: http://localhost:3000/speech-test
- **后端API**: http://localhost:8080/api/v1
- **健康检查**: http://localhost:8080/health

## 🎨 功能特性详解

### 1. AI智能对话
- **模型**: ERNIE 4.5 Turbo 128k
- **上下文长度**: 128k tokens
- **输出长度**: 最大123k tokens
- **温度参数**: 0.95（创造性回答）
- **专业领域**: 文化旅游、历史解读

### 2. 语音识别
- **技术**: Web Speech API
- **语言**: 中文普通话
- **浏览器支持**: Chrome、Edge（推荐）
- **实时转录**: 支持临时结果和最终结果
- **权限管理**: 自动请求麦克风权限

### 3. 地图交互
- **覆盖区域**: 上海虹口区
- **景点数量**: 8个主要文化景点
- **交互方式**: 点击景点触发AI对话
- **预设问题**: 针对特定景点的快速提问

### 4. 用户界面
- **设计风格**: 现代化、简洁
- **响应式**: 适配各种屏幕尺寸
- **主题色**: 蓝紫色渐变背景
- **组件库**: Ant Design 5
- **图标**: Ant Design Icons

## 📁 项目结构

```
v1/
├── public/                 # 静态资源
│   ├── site/              # 景点图片
│   ├── tips/              # 提示图标
│   └── index.html         # HTML模板
├── src/
│   ├── components/        # React组件
│   │   ├── AiChat/       # AI对话组件
│   │   ├── WorkflowSteps/ # 工作流步骤
│   │   └── ...
│   ├── pages/            # 页面组件
│   ├── services/         # 服务层
│   │   ├── baiduAiService.ts    # AI服务
│   │   ├── speechService.ts     # 语音服务
│   │   └── ...
│   ├── types/            # TypeScript类型定义
│   └── utils/            # 工具函数
├── server.js             # 后端服务器
├── package.json          # 项目配置
└── tsconfig.json         # TypeScript配置
```

## 🔧 API文档

### 后端API端点

#### 1. 聊天接口
```
POST /api/v1/chat/completions
Content-Type: application/json

{
  "model": "ernie-4.5-turbo-128k",
  "messages": [
    {
      "role": "system",
      "content": "你是一个专业的文化旅游向导..."
    },
    {
      "role": "user", 
      "content": "用户问题"
    }
  ],
  "stream": true,
  "temperature": 0.95,
  "max_completion_tokens": 2048
}
```

#### 2. 模型列表
```
GET /api/v1/models
Authorization: Bearer <api-key>
```

#### 3. 健康检查
```
GET /health
```

### 前端服务接口

#### AI服务 (baiduAiService)
```typescript
// 非流式对话
const response = await baiduAiService.chat(messages, options);

// 流式对话
for await (const chunk of baiduAiService.chatStream(messages, options)) {
  console.log(chunk);
}

// 简单问答
const answer = await baiduAiService.askQuestion(question, context);

// 景点问答
const answer = await baiduAiService.askAboutLocation(locationName, question);
```

#### 语音服务 (speechService)
```typescript
// 开始语音识别
await speechService.startListening(options, eventHandlers);

// 停止语音识别
speechService.stopListening();

// 检查支持性
const isSupported = speechService.getIsSupported();
```

## 🛠️ 开发指南

### 添加新景点

1. **添加景点图片**
   - 将图片放入 `public/site/` 目录
   - 命名格式：`数字.png`

2. **更新地图配置**
   - 编辑 `src/components/RouteMap/config.ts`
   - 添加景点坐标和信息

3. **测试景点交互**
   - 点击新景点应该触发AI对话
   - 验证景点特定的系统提示词

### 自定义AI提示词

编辑 `src/services/baiduAiService.ts` 中的 `askAboutLocation` 方法：

```typescript
const systemPrompt = `你是一个专业的文化旅游向导，对上海虹口区的各个景点和文化场所非常了解。请用专业、友好的语气回答用户关于${locationName}的问题。回答要准确、详细，并且富有文化内涵。`;
```

### 语音识别配置

在 `src/services/speechService.ts` 中修改识别参数：

```typescript
this.recognition.lang = 'zh-CN';           // 语言
this.recognition.continuous = false;        // 连续识别
this.recognition.interimResults = true;     // 临时结果
this.recognition.maxAlternatives = 1;       // 最大候选数
```

## 🔍 故障排除

### 常见问题

#### 1. 语音识别不工作
- **检查浏览器**: 使用Chrome或Edge浏览器
- **检查权限**: 允许麦克风权限
- **检查网络**: 确保网络连接稳定
- **使用测试页面**: 访问 `/speech-test` 进行诊断

#### 2. AI对话无响应
- **检查后端**: 确保后端服务器运行在8080端口
- **检查API密钥**: 验证百度千帆平台API密钥
- **查看控制台**: 检查浏览器开发者工具的错误信息

#### 3. 编译错误
- **清理缓存**: `npm start` 前先 `rm -rf node_modules && npm install`
- **检查TypeScript**: 确保类型定义正确
- **查看错误日志**: 根据具体错误信息修复

#### 4. 网络连接问题
- **代理设置**: 检查package.json中的proxy配置
- **端口冲突**: 确保3000和8080端口未被占用
- **防火墙**: 检查防火墙设置

### 调试工具

#### 1. 语音识别测试页面
访问 http://localhost:3000/speech-test 进行语音功能诊断

#### 2. AI测试页面  
访问 http://localhost:3000/ai-test 进行AI对话测试

#### 3. 浏览器开发者工具
- Network标签：查看API请求
- Console标签：查看错误日志
- Application标签：检查权限设置

## 📊 性能优化

### 前端优化
- 使用React.memo优化组件渲染
- 懒加载路由组件
- 图片资源压缩优化
- CSS代码分割

### 后端优化
- 流式响应减少首字节时间
- 错误处理和重试机制
- API响应缓存
- 请求限流

### 网络优化
- 启用gzip压缩
- 设置合适的缓存策略
- 使用CDN加速静态资源

## 🚀 部署指南

### 开发环境
```bash
# 前端
npm start

# 后端
node server.js
```

### 生产环境
```bash
# 构建前端
npm run build

# 启动生产服务器
node server.js

# 使用PM2管理进程
pm2 start server.js --name "xiaodao-backend"
pm2 serve build 3000 --name "xiaodao-frontend"
```

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000 8080
CMD ["node", "server.js"]
```

## 📈 更新日志

### v1.0.0 (2024-12-20)
- ✨ 初始版本发布
- 🎨 现代化UI设计
- 🤖 集成ERNIE 4.5 Turbo 128k模型
- 🎤 语音识别功能
- 🗺️ 虹口区景点地图交互
- 💬 流式AI对话
- 📱 响应式设计

### 近期更新
- 🔧 修复语音识别网络连接问题
- 🐛 解决TypeScript编译错误
- ⚡ 优化流式响应性能
- 🎯 完善错误处理机制

## 🤝 贡献指南

### 提交规范
- feat: 新功能
- fix: 修复bug  
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建工具或辅助工具的变动

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 发起Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址: [GitHub Repository]
- 问题反馈: [GitHub Issues]
- 邮箱: [contact@example.com]

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

**小道新茂研学创作助手** - 让文化旅游更智能，让研学创作更简单！🎉 