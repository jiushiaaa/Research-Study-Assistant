// 语音识别服务（本地/浏览器实现，DeepSeek暂不支持语音API）
// 仅保留本地Web Speech API相关实现，如需云端语音识别请集成其他服务。

export interface BaiduSpeechResult {
  transcript: string;
  confidence: number;
}

export class BaiduSpeechService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;

  // 检查浏览器是否支持录音
  isSupported(): boolean {
    return !!(navigator && 
             navigator.mediaDevices && 
             typeof navigator.mediaDevices.getUserMedia === 'function' &&
             typeof MediaRecorder !== 'undefined');
  }

  // 开始录音
  async startRecording(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('当前浏览器不支持录音功能');
    }

    if (this.isRecording) {
      throw new Error('录音已在进行中');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,  // 百度API推荐采样率
          channelCount: 1,    // 单声道
          echoCancellation: true,
          noiseSuppression: true
        } 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // 每秒收集一次数据
      console.log('🎤 开始录音...');
    } catch (error: any) {
      throw new Error(`无法启动录音: ${error.message}`);
    }
  }

  // 停止录音并识别
  async stopRecordingAndRecognize(): Promise<BaiduSpeechResult> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('没有正在进行的录音');
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('录音器未初始化'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          console.log('🔄 录音完成，开始语音识别...');
          
          // DeepSeek 暂无语音API，建议使用浏览器自带的 Web Speech API。
          // 如需云端语音识别请集成 DeepSeek 以外的服务。
          // recognizeAudio 已移除，仅支持本地语音识别。
          reject(new Error('当前仅支持本地Web Speech API语音识别，未集成云端API。'));
        } catch (error: any) {
          reject(error);
        } finally {
          this.cleanup();
        }
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
      
      // 停止所有音频轨道
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    });
  }

  // 将Blob转换为Base64
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除data:audio/webm;base64,前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // 清理资源
  private cleanup(): void {
    this.audioChunks = [];
    this.mediaRecorder = null;
    this.isRecording = false;
  }

  // 获取录音状态
  getIsRecording(): boolean {
    return this.isRecording;
  }

  // 取消录音
  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.cleanup();
      console.log('🚫 录音已取消');
    }
  }
}

// 简化的语音识别接口，兼容原有的speechService
export class SimplifiedSpeechService {
  private baiduSpeech = new BaiduSpeechService();
  private isListening = false;

  // 检查支持性
  getIsSupported(): boolean {
    return this.baiduSpeech.isSupported();
  }

  // 开始监听（简化版本）
  async startListening(
    options: any = {},
    eventHandlers: any = {}
  ): Promise<void> {
    if (this.isListening) {
      throw new Error('语音识别已在运行中');
    }

    try {
      this.isListening = true;
      eventHandlers.onStart?.();
      
      await this.baiduSpeech.startRecording();
      
      // 设置自动停止录音（5秒后）
      setTimeout(async () => {
        if (this.isListening) {
          try {
            const result = await this.baiduSpeech.stopRecordingAndRecognize();
            eventHandlers.onResult?.({
              transcript: result.transcript,
              confidence: result.confidence,
              isFinal: true
            });
          } catch (error: any) {
            eventHandlers.onError?.(error.message);
          } finally {
            this.isListening = false;
            eventHandlers.onEnd?.();
          }
        }
      }, 5000);
      
    } catch (error: any) {
      this.isListening = false;
      throw error;
    }
  }

  // 停止监听
  stopListening(): void {
    if (this.isListening) {
      this.baiduSpeech.cancelRecording();
      this.isListening = false;
    }
  }

  // 获取监听状态
  getIsListening(): boolean {
    return this.isListening;
  }
}

// 导出实例
export const baiduSpeechService = new BaiduSpeechService();
export const simplifiedSpeechService = new SimplifiedSpeechService(); 