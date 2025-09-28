#!/bin/bash

# GitHub 自动部署脚本
# 使用方法：在服务器上运行此脚本

echo "🚀 开始部署媒体画廊..."

# 设置变量
PROJECT_DIR="/var/www/media-gallery"
REPO_URL="https://github.com/ynitg/media-gallery.git"
SERVICE_NAME="media-gallery"

# 检查项目目录是否存在
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📁 创建项目目录..."
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
fi

# 进入项目目录
cd $PROJECT_DIR

# 如果是第一次部署，克隆仓库
if [ ! -d ".git" ]; then
    echo "📥 克隆仓库..."
    git clone $REPO_URL .
else
    echo "🔄 更新代码..."
    git pull origin main
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 创建必要的目录
echo "📁 创建必要目录..."
mkdir -p uploads/images uploads/videos uploads/backgrounds data

# 设置权限
echo "🔐 设置权限..."
chmod -R 755 uploads/
chmod -R 755 data/

# 重启服务
echo "🔄 重启服务..."
if pm2 list | grep -q $SERVICE_NAME; then
    pm2 restart $SERVICE_NAME
else
    pm2 start src/server.js --name $SERVICE_NAME
fi

echo "✅ 部署完成！"
echo "🌐 网站地址: http://your-server-ip:3000"
echo "🔧 管理面板: http://your-server-ip:3000/admin"
