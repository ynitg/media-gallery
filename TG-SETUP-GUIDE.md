# Telegram群组媒体抓取器 - 快速设置指南

## 🚀 功能特性
- ✅ 自动抓取Telegram群组的图片和视频
- ✅ 支持自定义标签
- ✅ 自动上传到您的媒体管理网站
- ✅ 支持批量处理多个群组
- ✅ 可配置抓取时间范围和文件数量限制

## 📋 快速开始

### 步骤1: 安装依赖
```bash
# 安装Telegram抓取器依赖
npm run install-tg-deps
```

### 步骤2: 获取Telegram API密钥
1. 访问 https://my.telegram.org/apps
2. 使用您的Telegram账号登录
3. 点击"Create new application"
4. 填写应用信息：
   - App title: `媒体抓取器`
   - Short name: `media-scraper`
   - Platform: `Desktop`
5. 获取 `api_id` 和 `api_hash`

### 步骤3: 配置抓取器
```bash
# 复制配置文件
cp tg-config-example.js tg-config.js
```

编辑 `tg-config.js` 文件：
```javascript
module.exports = {
  telegram: {
    // 替换为您的API密钥
    apiId: '12345678',           // 您的api_id
    apiHash: 'abcdef1234567890', // 您的api_hash
    sessionString: '',           // 首次运行后会自动生成
    phoneNumber: '+86138xxxxxxxx', // 您的手机号
  },
  
  website: {
    url: 'http://localhost:3000', // 您的网站地址
    adminCredentials: {
      username: 'admin',          // 管理员用户名
      password: 'admin123'        // 管理员密码
    }
  },
  
  scraping: {
    // 要抓取的群组（需要是群组的用户名，不是显示名称）
    groups: [
      '@your_group_username1',
      '@your_group_username2',
    ],
    
    // 自动添加的标签
    tags: [
      'Telegram抓取',
      '自动上传',
      '群组内容'
    ],
    
    maxFiles: 50,    // 每个群组最大抓取文件数
    timeRange: 24,   // 抓取最近24小时的内容
  }
};
```

### 步骤4: 测试配置
```bash
# 测试配置是否正确
npm run tg-scraper:test
```

### 步骤5: 开始抓取
```bash
# 开始抓取媒体文件
npm run tg-scraper
```

## 🔧 高级配置

### 自定义标签
您可以为不同的群组设置不同的标签：
```javascript
scraping: {
  groups: [
    '@tech_group',
    '@photo_group',
    '@video_group',
  ],
  tags: [
    '技术分享',
    '摄影作品',
    '视频内容'
  ],
}
```

### 时间范围设置
```javascript
scraping: {
  timeRange: 48, // 抓取最近48小时的内容
}
```

### 文件数量限制
```javascript
scraping: {
  maxFiles: 100, // 每个群组最多抓取100个文件
}
```

## 📱 获取群组用户名

### 方法1: 通过群组链接
1. 在Telegram中找到群组
2. 点击群组名称进入群组信息
3. 点击"分享群组"
4. 复制链接，用户名在链接中：`https://t.me/group_username`

### 方法2: 通过群组设置
1. 进入群组设置
2. 查看"群组类型"
3. 如果设置了用户名，会显示为 `@group_username`

## 🛠️ 常用命令

```bash
# 查看当前配置
npm run tg-scraper:config

# 测试配置
npm run tg-scraper:test

# 开始抓取
npm run tg-scraper

# 查看帮助
node run-tg-scraper.js --help
```

## ⚠️ 注意事项

1. **首次运行**：需要输入手机验证码进行登录
2. **群组权限**：确保您有权限访问要抓取的群组
3. **API限制**：遵守Telegram的API使用限制
4. **存储空间**：确保有足够的磁盘空间存储临时文件
5. **网络连接**：需要稳定的网络连接

## 🐛 故障排除

### 登录失败
- 检查API密钥是否正确
- 确保手机号格式正确（包含国家代码）
- 检查网络连接

### 抓取失败
- 检查群组用户名是否正确
- 确保有权限访问群组
- 检查群组是否有媒体文件

### 上传失败
- 检查网站地址是否正确
- 验证管理员凭据
- 确保网站服务正在运行

## 📊 抓取报告

每次抓取完成后，会生成详细的报告文件：
- 总文件数统计
- 按类型分类统计
- 按群组分类统计
- 文件大小统计
- 详细的文件列表

## 🔄 自动化运行

### 使用cron定时任务
```bash
# 编辑crontab
crontab -e

# 添加定时任务（每天凌晨2点运行）
0 2 * * * cd /path/to/your/project && npm run tg-scraper
```

### 使用PM2管理
```bash
# 安装PM2
npm install -g pm2

# 创建PM2配置文件
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'tg-scraper',
    script: 'run-tg-scraper.js',
    cron_restart: '0 2 * * *', // 每天凌晨2点运行
    autorestart: false,
    watch: false,
  }]
};
EOF

# 启动PM2任务
pm2 start ecosystem.config.js
```

## 📞 技术支持

如果遇到问题，请检查：
1. 配置文件是否正确
2. 网络连接是否正常
3. 群组权限是否足够
4. 网站服务是否运行

---

🎉 现在您可以开始使用Telegram媒体抓取器了！

