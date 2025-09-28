# GitHub 部署指南

## 方法一：GitHub Actions 自动部署

### 1. 设置 GitHub Secrets

在您的 GitHub 仓库中，进入 Settings → Secrets and variables → Actions，添加以下 secrets：

- `HOST`: 您的服务器 IP 地址
- `USERNAME`: 服务器用户名
- `SSH_KEY`: 您的私钥内容
- `PORT`: SSH 端口（默认 22）

### 2. 服务器准备

```bash
# 在服务器上安装必要软件
sudo apt update
sudo apt install -y nodejs npm git pm2

# 创建项目目录
sudo mkdir -p /var/www/media-gallery
sudo chown $USER:$USER /var/www/media-gallery

# 首次克隆仓库
cd /var/www/media-gallery
git clone https://github.com/ynitg/media-gallery.git .
npm install
pm2 start src/server.js --name media-gallery
pm2 save
pm2 startup
```

### 3. 自动部署

每次您推送代码到 main 分支时，GitHub Actions 会自动：
- 拉取最新代码
- 安装依赖
- 重启服务

## 方法二：手动部署脚本

### 1. 上传部署脚本到服务器

```bash
# 将 deploy-github.sh 上传到服务器
scp deploy-github.sh user@your-server:/home/user/
```

### 2. 运行部署脚本

```bash
# 在服务器上执行
chmod +x deploy-github.sh
./deploy-github.sh
```

## 方法三：Docker 部署

### 1. 服务器安装 Docker

```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. 部署应用

```bash
# 克隆仓库
git clone https://github.com/ynitg/media-gallery.git
cd media-gallery

# 启动服务
docker-compose -f docker-compose.prod.yml up -d
```

## 方法四：使用 Webhook 自动部署

### 1. 创建 webhook 接收脚本

```bash
#!/bin/bash
# webhook-deploy.sh

cd /var/www/media-gallery
git pull origin main
npm install
pm2 restart media-gallery
```

### 2. 设置 GitHub Webhook

在 GitHub 仓库设置中：
- 进入 Settings → Webhooks
- 添加 webhook URL: `http://your-server/webhook`
- 选择 "Just the push event"

## 域名和 SSL 配置

### 1. 配置 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 安装 SSL 证书

```bash
# 使用 Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 监控和维护

### 1. 查看服务状态

```bash
# PM2 管理
pm2 status
pm2 logs media-gallery
pm2 restart media-gallery

# Docker 管理
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs
```

### 2. 备份数据

```bash
# 备份上传文件和数据库
tar -czf backup-$(date +%Y%m%d).tar.gz uploads/ data/
```

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 PID
   ```

2. **权限问题**
   ```bash
   sudo chown -R $USER:$USER /var/www/media-gallery
   chmod -R 755 uploads/
   ```

3. **依赖安装失败**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 安全建议

1. 使用防火墙限制端口访问
2. 定期更新系统和依赖
3. 使用强密码和 SSH 密钥
4. 配置日志监控
5. 定期备份数据
