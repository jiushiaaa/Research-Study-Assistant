// DeepSeek大模型API服务
// 使用 deepseek-chat 模型
// - 上下文长度: 详见官方文档
// - 输出长度: 详见官方文档

// DeepSeek API Key - 用于大模型API认证
const API_KEY = "sk-dc8194d272f443df8199747e30434a16"; // 请替换为你的DeepSeek API Key

// DeepSeek API配置
const DEEPSEEK_API_BASE = "https://api.deepseek.com/v1";

// 聊天消息类型
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// API响应类型
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 流式响应类型
export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
}

// DeepSeek大模型API客户端
export class DeepSeekAiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = API_KEY;
    this.baseUrl = DEEPSEEK_API_BASE;
  }

  // 发送聊天请求
  async chat(
    messages: ChatMessage[],
    options: {
      model?: string;
      stream?: boolean;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): Promise<ChatCompletionResponse> {
    const {
      model = "deepseek-chat",
      stream = false,
      temperature = 0.95,
      max_tokens = 2048
    } = options;

    const requestBody = {
      model,
      messages,
      stream,
      temperature,
      max_tokens
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('DeepSeek大模型API调用失败:', error);
      throw error;
    }
  }

  // 流式聊天请求
  async *chatStream(
    messages: ChatMessage[],
    options: {
      model?: string;
      temperature?: number;
      max_tokens?: number;
    } = {}
  ): AsyncGenerator<string, void, unknown> {
    const {
      model = "deepseek-chat",
      temperature = 0.95,
      max_tokens = 2048
    } = options;

    const requestBody = {
      model,
      messages,
      stream: true,
      temperature,
      max_tokens
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '' || trimmedLine === 'data: [DONE]') continue;
            if (trimmedLine.startsWith('data: ')) {
              try {
                const jsonStr = trimmedLine.slice(6);
                const chunk: ChatCompletionChunk = JSON.parse(jsonStr);
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                  yield content;
                }
              } catch (parseError) {
                console.warn('解析流式响应块失败:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('DeepSeek流式API调用失败:', error);
      throw error;
    }
  }

  // 简单问答接口
  async askQuestion(question: string, context?: string): Promise<string> {
    const messages: ChatMessage[] = [];
    if (context) {
      messages.push({
        role: 'system',
        content: context
      });
    }
    messages.push({
      role: 'user',
      content: question
    });
    const response = await this.chat(messages);
    return response.choices[0]?.message?.content || '抱歉，我无法回答这个问题。';
  }

  // 获取支持的模型列表
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      if (!response.ok) {
        throw new Error(`获取模型列表失败: ${response.status}`);
      }
      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      console.error('获取模型列表失败:', error);
      return ['deepseek-chat', 'deepseek-reasoner']; // 返回默认模型列表
    }
  }
}

// 导出单例实例
export const deepSeekAiService = new DeepSeekAiService();