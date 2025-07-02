// 讯飞语音识别服务（前端部分）
// 依赖后端 /api/iflytek/speech 代理转发到讯飞API

export interface IflytekSpeechResult {
  transcript: string;
  confidence?: number;
}

export class IflytekSpeechService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;

  // 检查浏览器是否支持录音
  isSupported(): boolean {
    return !!(navigator && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function' && typeof MediaRecorder !== 'undefined');
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
          sampleRate: 16000,  // 讯飞推荐采样率
          channelCount: 1,    // 单声道
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      // 尝试使用wav格式，如果不支持则降级到webm
      let mimeType = 'audio/wav';
      if (!MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/webm;codecs=opus';
      }
      
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.audioChunks = [];
      this.isRecording = true;
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      console.log('🎤 开始录音，格式:', mimeType);
    } catch (error: any) {
      throw new Error(`无法启动录音: ${error.message}`);
    }
  }

  // 停止录音并上传到后端进行识别
  async stopRecordingAndRecognize(): Promise<IflytekSpeechResult> {
    if (!this.isRecording || !this.mediaRecorder) {
      throw new Error('没有正在进行的录音');
    }
    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder!.mimeType });
          console.log('📁 录音完成，文件大小:', audioBlob.size, '字节');
          
          // 上传到后端
          const formData = new FormData();
          formData.append('audio', audioBlob, 'speech.wav');
          
          const response = await fetch('/api/iflytek/speech', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`上传音频失败: ${response.status} ${errorData.error || response.statusText}`);
          }
          
          const data = await response.json();
          if (data && data.transcript) {
            console.log('✅ 语音识别成功:', data.transcript);
            resolve({ transcript: data.transcript, confidence: data.confidence });
          } else {
            reject(new Error('讯飞语音识别返回空结果'));
          }
        } catch (error: any) {
          console.error('❌ 语音识别失败:', error);
          reject(error);
        } finally {
          this.cleanup();
        }
      };
      
      this.mediaRecorder!.stop();
      this.isRecording = false;
      // 停止所有音频轨道
      this.mediaRecorder!.stream.getTracks().forEach(track => track.stop());
    });
  }

  // 取消录音
  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.cleanup();
    }
  }

  private cleanup() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

export const iflytekSpeechService = new IflytekSpeechService(); 