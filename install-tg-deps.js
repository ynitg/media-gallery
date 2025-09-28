#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 安装Telegram抓取器依赖...');

// 需要安装的依赖包
const dependencies = [
  'telegram',
  'axios',
  'form-data'
];

// 检查Node.js版本
function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    console.error('❌ 需要Node.js 16或更高版本');
    console.error(`   当前版本: ${version}`);
    process.exit(1);
  }
  
  console.log(`✅ Node.js版本检查通过: ${version}`);
}

// 安装依赖
function installDependencies() {
  console.log('📦 安装依赖包...');
  
  dependencies.forEach(dep => {
    try {
      console.log(`   安装 ${dep}...`);
      execSync(`npm install ${dep}`, { stdio: 'inherit' });
      console.log(`   ✅ ${dep} 安装成功`);
    } catch (error) {
      console.error(`   ❌ ${dep} 安装失败:`, error.message);
    }
  });
}

// 创建必要的目录
function createDirectories() {
  const dirs = ['./downloads', './logs'];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 创建目录: ${dir}`);
    }
  });
}

// 创建示例配置文件
function createExampleConfig() {
  const exampleConfig = `// Telegram抓取器配置示例
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
};`;

  if (!fs.existsSync('tg-config-example.js')) {
    fs.writeFileSync('tg-config-example.js', exampleConfig);
    console.log('📝 创建示例配置文件: tg-config-example.js');
  }
}

// 创建使用说明
function createReadme() {
  const readme = `# Telegram媒体抓取器

## 功能特性
- 自动抓取Telegram群组的图片和视频
- 支持自定义标签
- 自动上传到您的媒体管理网站
- 支持批量处理多个群组
- 可配置抓取时间范围和文件数量限制

## 快速开始

### 1. 获取Telegram API密钥
1. 访问 https://my.telegram.org/apps
2. 登录您的Telegram账号
3. 创建新应用，获取 apiId 和 apiHash

### 2. 配置抓取器
1. 复制示例配置文件：
   \`\`\`bash
   cp tg-config-example.js tg-config.js
   \`\`\`

2. 编辑配置文件：
   \`\`\`javascript
   // 设置您的API密钥
   apiId: 'YOUR_API_ID',
   apiHash: 'YOUR_API_HASH',
   
   // 设置网站地址和管理员凭据
   website: {
     url: 'http://your-website.com',
     adminCredentials: {
       username: 'your_username',
       password: 'your_password'
     }
   },
   
   // 设置要抓取的群组
   groups: [
     '@your_group_username1',
     '@your_group_username2',
   ],
   
   // 设置自定义标签
   tags: [
     '自定义标签1',
     '自定义标签2',
   ],
   \`\`\`

### 3. 运行抓取器
\`\`\`bash
# 测试配置
node run-tg-scraper.js --test

# 开始抓取
node run-tg-scraper.js

# 查看帮助
node run-tg-scraper.js --help
\`\`\`

## 配置说明

### Telegram配置
- \`apiId\`: Telegram应用ID
- \`apiHash\`: Telegram应用哈希
- \`sessionString\`: 会话字符串（首次运行后自动生成）
- \`phoneNumber\`: 手机号（首次登录使用）

### 网站配置
- \`url\`: 您的媒体管理网站地址
- \`adminCredentials\`: 管理员登录凭据

### 抓取配置
- \`groups\`: 要抓取的群组用户名列表
- \`tags\`: 自动添加的标签
- \`maxFiles\`: 每个群组最大抓取文件数
- \`timeRange\`: 抓取时间范围（小时）

## 注意事项
1. 首次运行需要手机验证码登录
2. 确保有足够的磁盘空间存储临时文件
3. 遵守Telegram的使用条款和群组规则
4. 建议在非高峰时段运行抓取任务

## 故障排除
- 如果登录失败，请检查API密钥是否正确
- 如果抓取失败，请检查群组用户名是否正确
- 如果上传失败，请检查网站地址和凭据是否正确
`;

  if (!fs.existsSync('TG-SCRAPER-README.md')) {
    fs.writeFileSync('TG-SCRAPER-README.md', readme);
    console.log('📖 创建使用说明: TG-SCRAPER-README.md');
  }
}

// 主函数
function main() {
  try {
    checkNodeVersion();
    installDependencies();
    createDirectories();
    createExampleConfig();
    createReadme();
    
    console.log('\\n🎉 安装完成！');
    console.log('\\n📋 下一步操作:');
    console.log('1. 访问 https://my.telegram.org/apps 获取API密钥');
    console.log('2. 复制并编辑配置文件: cp tg-config-example.js tg-config.js');
    console.log('3. 测试配置: node run-tg-scraper.js --test');
    console.log('4. 开始抓取: node run-tg-scraper.js');
    console.log('\\n📖 详细说明请查看: TG-SCRAPER-README.md');
    
  } catch (error) {
    console.error('❌ 安装失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

