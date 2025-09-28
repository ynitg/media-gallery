const { TelegramApi } = require('telegram');
const { StringSession } = require('telegram/sessions');
const { Api } = require('telegram/tl');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

class TelegramScraper {
  constructor(config) {
    this.apiId = config.apiId;
    this.apiHash = config.apiHash;
    this.sessionString = config.sessionString;
    this.client = null;
    this.websiteUrl = config.websiteUrl;
    this.adminCredentials = config.adminCredentials;
    this.downloadDir = config.downloadDir || './downloads';
    this.tags = config.tags || [];
    this.maxFiles = config.maxFiles || 50;
    this.supportedTypes = ['photo', 'video', 'document'];
    
    // 创建下载目录
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  async initialize() {
    try {
      const session = new StringSession(this.sessionString);
      this.client = new TelegramApi(session, this.apiId, this.apiHash, {
        connectionRetries: 5,
      });
      
      await this.client.start({
        phoneNumber: async () => {
          throw new Error('请先设置sessionString，或使用手机号登录');
        },
        password: async () => {
          throw new Error('请先设置sessionString，或使用密码');
        },
        phoneCode: async () => {
          throw new Error('请先设置sessionString，或使用验证码');
        },
        onError: (err) => console.log('Telegram连接错误:', err),
      });
      
      console.log('✅ Telegram客户端初始化成功');
      return true;
    } catch (error) {
      console.error('❌ Telegram客户端初始化失败:', error.message);
      return false;
    }
  }

  async scrapeGroupMedia(groupUsername, options = {}) {
    try {
      console.log(`🔍 开始抓取群组: ${groupUsername}`);
      
      // 获取群组信息
      const group = await this.client.getEntity(groupUsername);
      console.log(`📱 群组名称: ${group.title}`);
      
      // 获取消息历史
      const messages = await this.client.getMessages(group, {
        limit: options.limit || this.maxFiles,
        offsetDate: options.offsetDate || 0,
      });
      
      console.log(`📨 获取到 ${messages.length} 条消息`);
      
      const mediaFiles = [];
      let processedCount = 0;
      
      for (const message of messages) {
        if (processedCount >= this.maxFiles) break;
        
        const mediaInfo = await this.processMessage(message, groupUsername);
        if (mediaInfo) {
          mediaFiles.push(mediaInfo);
          processedCount++;
        }
      }
      
      console.log(`📁 找到 ${mediaFiles.length} 个媒体文件`);
      return mediaFiles;
      
    } catch (error) {
      console.error('❌ 抓取群组媒体失败:', error.message);
      return [];
    }
  }

  async processMessage(message, groupUsername) {
    try {
      let mediaInfo = null;
      
      // 检查消息类型
      if (message.photo) {
        mediaInfo = await this.downloadPhoto(message, groupUsername);
      } else if (message.video) {
        mediaInfo = await this.downloadVideo(message, groupUsername);
      } else if (message.document && this.isVideoDocument(message.document)) {
        mediaInfo = await this.downloadDocument(message, groupUsername);
      }
      
      if (mediaInfo) {
        // 添加群组信息作为标签
        mediaInfo.tags = [
          ...this.tags,
          `TG群组:${groupUsername}`,
          `来源:Telegram`
        ];
        
        // 添加消息时间
        mediaInfo.uploadTime = new Date().toISOString();
        mediaInfo.originalMessageId = message.id;
        
        console.log(`✅ 下载完成: ${mediaInfo.originalName}`);
      }
      
      return mediaInfo;
      
    } catch (error) {
      console.error('❌ 处理消息失败:', error.message);
      return null;
    }
  }

  async downloadPhoto(message, groupUsername) {
    try {
      const photo = message.photo;
      const file = await this.client.downloadMedia(photo, {
        workers: 1,
      });
      
      const buffer = Buffer.from(file);
      const extension = this.getPhotoExtension(photo);
      const filename = this.generateFilename('image', extension, groupUsername);
      const filepath = path.join(this.downloadDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      return {
        type: 'image',
        path: filepath,
        originalName: filename,
        size: buffer.length,
        mimeType: `image/${extension}`,
      };
      
    } catch (error) {
      console.error('❌ 下载图片失败:', error.message);
      return null;
    }
  }

  async downloadVideo(message, groupUsername) {
    try {
      const video = message.video;
      const file = await this.client.downloadMedia(video, {
        workers: 1,
      });
      
      const buffer = Buffer.from(file);
      const extension = this.getVideoExtension(video);
      const filename = this.generateFilename('video', extension, groupUsername);
      const filepath = path.join(this.downloadDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      return {
        type: 'video',
        path: filepath,
        originalName: filename,
        size: buffer.length,
        mimeType: `video/${extension}`,
        duration: video.duration,
      };
      
    } catch (error) {
      console.error('❌ 下载视频失败:', error.message);
      return null;
    }
  }

  async downloadDocument(message, groupUsername) {
    try {
      const document = message.document;
      const file = await this.client.downloadMedia(document, {
        workers: 1,
      });
      
      const buffer = Buffer.from(file);
      const extension = this.getDocumentExtension(document);
      const filename = this.generateFilename('video', extension, groupUsername);
      const filepath = path.join(this.downloadDir, filename);
      
      fs.writeFileSync(filepath, buffer);
      
      return {
        type: 'video',
        path: filepath,
        originalName: filename,
        size: buffer.length,
        mimeType: document.mimeType,
      };
      
    } catch (error) {
      console.error('❌ 下载文档失败:', error.message);
      return null;
    }
  }

  generateFilename(type, extension, groupUsername) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const groupName = groupUsername.replace('@', '').replace(/[^a-zA-Z0-9]/g, '_');
    return `${type}_${groupName}_${timestamp}_${random}.${extension}`;
  }

  getPhotoExtension(photo) {
    // 根据photo对象确定文件扩展名
    if (photo.sizes && photo.sizes.length > 0) {
      const largestSize = photo.sizes[photo.sizes.length - 1];
      if (largestSize.type === 'j') return 'jpg';
      if (largestSize.type === 'p') return 'png';
      if (largestSize.type === 'w') return 'webp';
    }
    return 'jpg'; // 默认
  }

  getVideoExtension(video) {
    // 根据video对象确定文件扩展名
    if (video.mimeType) {
      if (video.mimeType.includes('mp4')) return 'mp4';
      if (video.mimeType.includes('webm')) return 'webm';
      if (video.mimeType.includes('avi')) return 'avi';
    }
    return 'mp4'; // 默认
  }

  getDocumentExtension(document) {
    if (document.mimeType) {
      if (document.mimeType.includes('mp4')) return 'mp4';
      if (document.mimeType.includes('webm')) return 'webm';
      if (document.mimeType.includes('avi')) return 'avi';
      if (document.mimeType.includes('mov')) return 'mov';
    }
    return 'mp4'; // 默认
  }

  isVideoDocument(document) {
    if (!document.mimeType) return false;
    return document.mimeType.startsWith('video/');
  }

  async uploadToWebsite(mediaInfo) {
    try {
      console.log(`📤 上传到网站: ${mediaInfo.originalName}`);
      
      // 创建表单数据
      const formData = new FormData();
      formData.append('file', fs.createReadStream(mediaInfo.path));
      formData.append('tags', mediaInfo.tags.join(','));
      
      // 确定上传端点
      const uploadUrl = mediaInfo.type === 'image' 
        ? `${this.websiteUrl}/admin/upload/image`
        : `${this.websiteUrl}/admin/upload/video`;
      
      // 发送请求
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          ...formData.getHeaders(),
          'Cookie': await this.getAuthCookie(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });
      
      if (response.data.success) {
        console.log(`✅ 上传成功: ${mediaInfo.originalName}`);
        return true;
      } else {
        console.error(`❌ 上传失败: ${response.data.error}`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ 上传到网站失败: ${error.message}`);
      return false;
    }
  }

  async getAuthCookie() {
    try {
      // 登录获取认证cookie
      const loginResponse = await axios.post(`${this.websiteUrl}/admin/login`, {
        username: this.adminCredentials.username,
        password: this.adminCredentials.password,
      }, {
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
      });
      
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies) {
        return cookies.map(cookie => cookie.split(';')[0]).join('; ');
      }
      
      return '';
    } catch (error) {
      console.error('❌ 获取认证cookie失败:', error.message);
      return '';
    }
  }

  async cleanup() {
    try {
      // 清理下载的文件
      const files = fs.readdirSync(this.downloadDir);
      for (const file of files) {
        const filepath = path.join(this.downloadDir, file);
        fs.unlinkSync(filepath);
      }
      
      console.log('🧹 清理临时文件完成');
    } catch (error) {
      console.error('❌ 清理文件失败:', error.message);
    }
  }

  async run(groupUsernames, options = {}) {
    try {
      console.log('🚀 开始Telegram媒体抓取任务');
      
      // 初始化客户端
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Telegram客户端初始化失败');
      }
      
      const allMediaFiles = [];
      
      // 处理每个群组
      for (const groupUsername of groupUsernames) {
        const mediaFiles = await this.scrapeGroupMedia(groupUsername, options);
        allMediaFiles.push(...mediaFiles);
        
        // 上传到网站
        for (const mediaInfo of mediaFiles) {
          await this.uploadToWebsite(mediaInfo);
        }
      }
      
      console.log(`🎉 任务完成！共处理 ${allMediaFiles.length} 个媒体文件`);
      
      // 清理临时文件
      await this.cleanup();
      
      return allMediaFiles;
      
    } catch (error) {
      console.error('❌ 任务执行失败:', error.message);
      throw error;
    } finally {
      if (this.client) {
        await this.client.disconnect();
      }
    }
  }
}

module.exports = TelegramScraper;


