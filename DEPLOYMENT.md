# 媒体管理网站部署指南

## 🚀 部署方案

### 方案一：传统VPS部署（推荐）

#### 1. 服务器要求
- Ubuntu 18.04+ 或 CentOS 7+
- 至少1GB RAM
- 至少10GB存储空间
- Node.js 18+

#### 2. 部署步骤

```bash
# 1. 上传项目文件到服务器
scp -r . user@your-server:/var/www/media-gallery/

# 2. 登录服务器
ssh user@your-server

# 3. 进入项目目录
cd /var/www/media-gallery/

# 4. 运行部署脚本
chmod +x deploy.sh
./deploy.sh

# 5. 配置Nginx（可选）
sudo cp nginx.conf /etc/nginx/sites-available/media-gallery
sudo ln -s /etc/nginx/sites-available/media-gallery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. 管理命令
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs media-gallery

# 重启应用
pm2 restart media-gallery

# 停止应用
pm2 stop media-gallery
```

### 方案二：Docker部署

#### 1. 使用Docker Compose
```bash
# 1. 设置环境变量
export ADMIN_USER="your_admin_username"
export ADMIN_PASS="your_secure_password"

# 2. 启动服务
docker-compose up -d

# 3. 查看状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

#### 2. 使用Docker命令
```bash
# 构建镜像
docker build -t media-gallery .

# 运行容器
docker run -d \
  --name media-gallery \
  -p 3000:3000 \
  -e ADMIN_USER=your_admin_username \
  -e ADMIN_PASS=your_secure_password \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/data:/app/data \
  media-gallery
```

### 方案三：云平台部署

#### 1. Heroku部署
```bash
# 安装Heroku CLI
# 创建Procfile
echo "web: node src/server.js" > Procfile

# 登录Heroku
heroku login

# 创建应用
heroku create your-app-name

# 设置环境变量
heroku config:set ADMIN_USER=your_admin_username
heroku config:set ADMIN_PASS=your_secure_password

# 部署
git push heroku main
```

#### 2. Vercel部署
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

## 🔧 配置说明

### 环境变量
- `PORT`: 端口号（默认3000）
- `ADMIN_USER`: 管理员用户名
- `ADMIN_PASS`: 管理员密码
- `NODE_ENV`: 运行环境（production/development）

### 文件结构
```
/var/www/media-gallery/
├── src/
├── views/
├── uploads/
│   ├── images/
│   ├── videos/
│   └── backgrounds/
├── data/
│   ├── media.json
│   └── settings.json
└── package.json
```

## 🛡️ 安全建议

1. **更改默认密码**
   ```bash
   export ADMIN_USER="your_secure_username"
   export ADMIN_PASS="your_very_secure_password"
   ```

2. **使用HTTPS**
   - 申请SSL证书
   - 配置Nginx SSL
   - 强制HTTPS重定向

3. **防火墙配置**
   ```bash
   # 只开放必要端口
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

4. **定期备份**
   ```bash
   # 备份脚本
   tar -czf backup-$(date +%Y%m%d).tar.gz uploads/ data/
   ```

## 📊 监控和维护

### 日志监控
```bash
# PM2日志
pm2 logs media-gallery --lines 100

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 性能监控
```bash
# 查看PM2状态
pm2 monit

# 查看系统资源
htop
df -h
```

## 🆘 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **权限问题**
   ```bash
   sudo chown -R www-data:www-data /var/www/media-gallery/
   sudo chmod -R 755 /var/www/media-gallery/
   ```

3. **内存不足**
   ```bash
   # 增加swap
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

## 📞 技术支持

如果遇到问题，请检查：
1. 服务器日志
2. 应用日志
3. 网络连接
4. 文件权限
5. 环境变量设置

















