#!/usr/bin/env node

const TelegramScraper = require('./tg-scraper');
const config = require('./tg-config');
const fs = require('fs');
const path = require('path');

// 日志函数
function log(level, message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  
  if (config.logging.saveToFile) {
    fs.appendFileSync(config.logging.logFile, logMessage + '\n');
  }
}

// 检查配置
function validateConfig() {
  const errors = [];
  
  if (!config.telegram.apiId || config.telegram.apiId === 'YOUR_API_ID') {
    errors.push('请在tg-config.js中设置正确的apiId');
  }
  
  if (!config.telegram.apiHash || config.telegram.apiHash === 'YOUR_API_HASH') {
    errors.push('请在tg-config.js中设置正确的apiHash');
  }
  
  if (!config.website.url || config.website.url === 'http://localhost:3000') {
    errors.push('请在tg-config.js中设置正确的网站URL');
  }
  
  if (!config.scraping.groups || config.scraping.groups.length === 0) {
    errors.push('请在tg-config.js中设置要抓取的群组');
  }
  
  if (errors.length > 0) {
    log('error', '配置错误:');
    errors.forEach(error => log('error', `  - ${error}`));
    return false;
  }
  
  return true;
}

// 创建抓取器实例
function createScraper() {
  return new TelegramScraper({
    apiId: config.telegram.apiId,
    apiHash: config.telegram.apiHash,
    sessionString: config.telegram.sessionString,
    websiteUrl: config.website.url,
    adminCredentials: config.website.adminCredentials,
    downloadDir: config.download.directory,
    tags: config.scraping.tags,
    maxFiles: config.scraping.maxFiles,
  });
}

// 主函数
async function main() {
  try {
    log('info', '🚀 启动Telegram媒体抓取器');
    
    // 验证配置
    if (!validateConfig()) {
      process.exit(1);
    }
    
    // 创建抓取器
    const scraper = createScraper();
    
    // 计算时间范围
    const timeRange = config.scraping.timeRange * 60 * 60 * 1000; // 转换为毫秒
    const offsetDate = new Date(Date.now() - timeRange);
    
    // 抓取选项
    const options = {
      limit: config.scraping.maxFiles,
      offsetDate: offsetDate,
    };
    
    log('info', `📋 抓取配置:`);
    log('info', `  - 群组数量: ${config.scraping.groups.length}`);
    log('info', `  - 最大文件数: ${config.scraping.maxFiles}`);
    log('info', `  - 时间范围: 最近${config.scraping.timeRange}小时`);
    log('info', `  - 自定义标签: ${config.scraping.tags.join(', ')}`);
    
    // 开始抓取
    const results = await scraper.run(config.scraping.groups, options);
    
    log('info', `🎉 抓取完成！`);
    log('info', `  - 总文件数: ${results.length}`);
    log('info', `  - 图片数: ${results.filter(f => f.type === 'image').length}`);
    log('info', `  - 视频数: ${results.filter(f => f.type === 'video').length}`);
    
    // 生成报告
    generateReport(results);
    
  } catch (error) {
    log('error', `❌ 执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 生成抓取报告
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: results.length,
    byType: {
      image: results.filter(f => f.type === 'image').length,
      video: results.filter(f => f.type === 'video').length,
    },
    byGroup: {},
    totalSize: results.reduce((sum, f) => sum + (f.size || 0), 0),
    files: results.map(f => ({
      name: f.originalName,
      type: f.type,
      size: f.size,
      tags: f.tags,
    }))
  };
  
  // 按群组统计
  results.forEach(file => {
    const groupTag = file.tags.find(tag => tag.startsWith('TG群组:'));
    if (groupTag) {
      const groupName = groupTag.replace('TG群组:', '');
      report.byGroup[groupName] = (report.byGroup[groupName] || 0) + 1;
    }
  });
  
  // 保存报告
  const reportFile = `scrape-report-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  log('info', `📊 抓取报告已保存: ${reportFile}`);
}

// 处理命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Telegram媒体抓取器使用说明:

用法: node run-tg-scraper.js [选项]

选项:
  --help, -h     显示帮助信息
  --config       显示当前配置
  --test         测试配置（不执行抓取）
  --groups       指定要抓取的群组（覆盖配置文件）
  --tags         指定自定义标签（覆盖配置文件）
  --max-files    指定最大文件数（覆盖配置文件）

示例:
  node run-tg-scraper.js
  node run-tg-scraper.js --test
  node run-tg-scraper.js --groups @group1 @group2
  node run-tg-scraper.js --tags "自定义标签1" "自定义标签2"
    `);
    process.exit(0);
  }
  
  if (args.includes('--config')) {
    console.log('当前配置:');
    console.log(JSON.stringify(config, null, 2));
    process.exit(0);
  }
  
  if (args.includes('--test')) {
    log('info', '🧪 测试模式 - 验证配置');
    if (validateConfig()) {
      log('info', '✅ 配置验证通过');
    } else {
      log('error', '❌ 配置验证失败');
      process.exit(1);
    }
    process.exit(0);
  }
  
  // 处理其他参数...
  // 这里可以添加更多命令行参数处理逻辑
}

// 启动程序
if (require.main === module) {
  parseArgs();
  main();
}

module.exports = { main, createScraper, validateConfig };

