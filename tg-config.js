// Telegram抓取器配置示例
module.exports = {
  telegram: {
    // 从 https://my.telegram.org/apps 获取
    apiId: 'YOUR_API_ID',
    apiHash: 'YOUR_API_HASH',
    sessionString: '', // 首次运行后会自动生成
    phoneNumber: '+86xxxxxxxxxx', // 您的手机号
  },
  
  website: {
    url: 'http://localhost:3000',
    adminCredentials: {
      username: 'admin',
      password: 'admin123'
    }
  },
  
  scraping: {
    groups: [
      '@your_group_username1',
      '@your_group_username2',
    ],
    tags: [
      'Telegram抓取',
      '自动上传',
      '群组内容'
    ],
    maxFiles: 50,
    timeRange: 24,
  },
  
  download: {
    directory: './downloads',
    autoCleanup: true,
    concurrency: 3,
  },
  
  upload: {
    autoUpload: true,
    retryCount: 3,
    uploadDelay: 1000,
  },
  
  logging: {
    level: 'info',
    saveToFile: true,
    logFile: './tg-scraper.log',
  }
};
