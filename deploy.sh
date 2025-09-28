#!/bin/bash

# 媒体管理网站部署脚本
echo "开始部署媒体管理网站..."

# 1. 安装Node.js (如果未安装)
if ! command -v node &> /dev/null; then
    echo "安装Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 2. 安装PM2进程管理器
if ! command -v pm2 &> /dev/null; then
    echo "安装PM2..."
    sudo npm install -g pm2
fi

# 3. 安装项目依赖
echo "安装项目依赖..."
npm install

# 4. 设置环境变量
echo "设置环境变量..."
export ADMIN_USER="your_admin_username"
export ADMIN_PASS="your_secure_password"
export PORT=3000

# 5. 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'media-gallery',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      ADMIN_USER: 'your_admin_username',
      ADMIN_PASS: 'your_secure_password'
    }
  }]
};
EOF

# 6. 启动应用
echo "启动应用..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "部署完成！"
echo "访问地址: http://your-server-ip:3000"
echo "管理命令: pm2 status, pm2 logs, pm2 restart media-gallery"



















