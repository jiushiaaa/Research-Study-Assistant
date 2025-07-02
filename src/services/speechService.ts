// 语音识别服务
import { iflytekSpeechService, IflytekSpeechResult } from './iflytekSpeechService';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

// 语音识别事件类型
export type SpeechRecognitionEventType = 
  | 'start'
  | 'end'
  | 'result'
  | 'error'
  | 'nomatch'
  | 'soundstart'
  | 'soundend'
  | 'speechstart'
  | 'speechend';

export interface SpeechRecognitionEventHandlers {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: string) => void;
  onNoMatch?: () => void;
  onSoundStart?: () => void;
  onSoundEnd?: () => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
}

// 语音识别服务类
export class SpeechService {
  private recognition: any = null;
  private isSupported: boolean = false;
  private isListening: boolean = false;
  private eventHandlers: SpeechRecognitionEventHandlers = {};
  private useIflytek: boolean = false;

  constructor() {
    this.checkSupport();
  }

  // 检查浏览器是否支持语音识别
  private checkSupport(): void {
    // 优先检测讯飞录音支持
    if (iflytekSpeechService.isSupported()) {
      this.isSupported = true;
      this.useIflytek = true;
      return;
    }
    // 其次检测Web Speech API
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecureContext) {
      this.isSupported = false;
      return;
    }
    if ('webkitSpeechRecognition' in window) {
      this.isSupported = true;
      this.useIflytek = false;
    } else if ('SpeechRecognition' in window) {
      this.isSupported = true;
      this.useIflytek = false;
    } else {
      this.isSupported = false;
      this.useIflytek = false;
    }
  }

  // 初始化语音识别
  private initRecognition(options: SpeechRecognitionOptions = {}): void {
    if (!this.isSupported) {
      throw new Error('当前浏览器不支持语音识别功能');
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    // 设置识别参数
    this.recognition.lang = options.language || 'zh-CN';
    this.recognition.continuous = options.continuous || false;
    this.recognition.interimResults = options.interimResults || true;
    this.recognition.maxAlternatives = options.maxAlternatives || 1;

    // 绑定事件处理器
    this.recognition.onstart = () => {
      this.isListening = true;
      this.eventHandlers.onStart?.();
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.eventHandlers.onEnd?.();
    };

    this.recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      const isFinal = lastResult.isFinal;

      this.eventHandlers.onResult?.({
        transcript,
        confidence,
        isFinal
      });
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = '语音识别发生错误';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = '没有检测到语音输入';
          break;
        case 'audio-capture':
          errorMessage = '无法捕获音频';
          break;
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝';
          break;
        case 'network':
          errorMessage = '网络连接错误';
          break;
        case 'service-not-allowed':
          errorMessage = '语音识别服务不可用';
          break;
        default:
          errorMessage = `语音识别错误: ${event.error}`;
      }

      this.eventHandlers.onError?.(errorMessage);
    };

    this.recognition.onnomatch = () => {
      this.eventHandlers.onNoMatch?.();
    };

    this.recognition.onsoundstart = () => {
      this.eventHandlers.onSoundStart?.();
    };

    this.recognition.onsoundend = () => {
      this.eventHandlers.onSoundEnd?.();
    };

    this.recognition.onspeechstart = () => {
      this.eventHandlers.onSpeechStart?.();
    };

    this.recognition.onspeechend = () => {
      this.eventHandlers.onSpeechEnd?.();
    };
  }

  // 开始语音识别
  async startListening(
    options: SpeechRecognitionOptions = {},
    eventHandlers: SpeechRecognitionEventHandlers = {}
  ): Promise<void> {
    if (!this.isSupported) {
      throw new Error('当前浏览器不支持语音识别功能');
    }
    this.eventHandlers = eventHandlers;
    if (this.useIflytek) {
      // 讯飞录音+识别
      eventHandlers.onStart?.();
      await iflytekSpeechService.startRecording();
      setTimeout(async () => {
        try {
          const result: IflytekSpeechResult = await iflytekSpeechService.stopRecordingAndRecognize();
          eventHandlers.onResult?.({ transcript: result.transcript, confidence: result.confidence ?? 1, isFinal: true });
        } catch (error: any) {
          eventHandlers.onError?.(error.message);
        } finally {
          eventHandlers.onEnd?.();
        }
      }, 5000); // 录音5秒
      return;
    }

    console.log('🎤 开始语音识别流程...');
    
    if (this.isListening) {
      const errorMsg = '语音识别已经在运行中';
      console.warn('⚠️', errorMsg);
      throw new Error(errorMsg);
    }

    // 检查麦克风权限
    console.log('🔐 检查麦克风权限...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ 麦克风权限获取成功');
      // 立即释放流，避免占用麦克风
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      let errorMsg = '无法获取麦克风权限';
      if (error.name === 'NotAllowedError') {
        errorMsg = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
      } else if (error.name === 'NotFoundError') {
        errorMsg = '未找到麦克风设备';
      } else if (error.name === 'NotReadableError') {
        errorMsg = '麦克风设备被其他应用占用';
      }
      console.error('❌ 麦克风权限错误:', error);
      throw new Error(errorMsg);
    }

    console.log('🔧 初始化语音识别...');
    this.initRecognition(options);
    
    try {
      console.log('🚀 启动语音识别...');
      this.recognition.start();
    } catch (error: any) {
      console.error('❌ 启动语音识别失败:', error);
      throw new Error(`启动语音识别失败: ${error.message || '未知错误'}`);
    }
  }

  // 停止语音识别
  stopListening(): void {
    if (this.useIflytek) {
      iflytekSpeechService.cancelRecording();
      return;
    }
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  // 中止语音识别
  abortListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort();
    }
  }

  // 获取是否正在监听
  getIsListening(): boolean {
    if (this.useIflytek) {
      return iflytekSpeechService.getIsRecording();
    }
    return this.isListening;
  }

  // 获取是否支持语音识别
  getIsSupported(): boolean {
    return this.isSupported;
  }

  // 一次性语音识别（Promise版本）
  async recognizeOnce(options: SpeechRecognitionOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('当前浏览器不支持语音识别功能'));
        return;
      }

      const eventHandlers: SpeechRecognitionEventHandlers = {
        onResult: (result) => {
          if (result.isFinal) {
            resolve(result.transcript);
          }
        },
        onError: (error) => {
          reject(new Error(error));
        },
        onEnd: () => {
          // 如果没有收到结果就结束了，可能是没有识别到语音
          if (!this.isListening) {
            reject(new Error('语音识别结束，未识别到有效语音'));
          }
        }
      };

      this.startListening(
        { ...options, continuous: false },
        eventHandlers
      ).catch(reject);
    });
  }

  // 检查麦克风权限
  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  // 请求麦克风权限
  async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('请求麦克风权限失败:', error);
      return false;
    }
  }
}

// 导出单例实例
export const speechService = new SpeechService(); 