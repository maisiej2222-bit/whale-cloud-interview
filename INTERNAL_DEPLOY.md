# 🏢 公司内网服务器部署指南

## 方案选择

### 推荐：使用 Docker 部署（最简单）

适用于任何 Linux 服务器（阿里云、腾讯云、公司机房）

---

## 📋 部署前准备

### 1. 服务器要求

- **操作系统**：Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **内存**：至少 1GB
- **CPU**：1核以上
- **网络**：能访问 `lab.iwhalecloud.com`
- **端口**：80 或 443 对外开放

### 2. 软件要求

- Docker（推荐）
- 或 Node.js 20+
- Nginx（可选，用于反向代理）

---

## 🚀 方式一：Docker 部署（推荐）

### 步骤 1：创建 Dockerfile

在项目根目录创建 `Dockerfile`:

```dockerfile
# 使用 Node.js 20
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json
COPY package*.json ./
COPY server/package*.json ./server/

# 安装依赖
RUN npm install --production
RUN cd server && npm install --production

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 5001

# 设置环境变量
ENV NODE_ENV=production

# 启动应用
CMD ["npm", "run", "start"]
```

### 步骤 2：创建 .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.DS_Store
dist
```

### 步骤 3：创建 docker-compose.yml

```yaml
version: '3.8'

services:
  whale-cloud-interview:
    build: .
    ports:
      - "5001:5001"
    environment:
      - ANTHROPIC_AUTH_TOKEN=ailab_RQZwGRKuPwONzqJyRMhVeQkxYYex2lKu/AhRkMyKRY0ixPqp9ya60MWwL8ffvDV6JLia+weHUMrF8AdmnFnVrfWTd1INneGvdnkzb7pypmma0inl7HVvEvE=
      - ANTHROPIC_BASE_URL=https://lab.iwhalecloud.com/gpt-proxy/anthropic
      - ANTHROPIC_MODEL=claude-4.5-sonnet
      - NODE_ENV=production
      - PORT=5001
      - ADMIN_PASSWORD=whale2026
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    networks:
      - whale-network

networks:
  whale-network:
    driver: bridge
```

### 步骤 4：部署到服务器

```bash
# 1. 上传代码到服务器
scp -r /Users/chenhong/employee-culture-platform user@your-server:/opt/

# 2. SSH 登录服务器
ssh user@your-server

# 3. 进入项目目录
cd /opt/employee-culture-platform

# 4. 构建并启动
docker-compose up -d

# 5. 查看日志
docker-compose logs -f

# 6. 查看状态
docker-compose ps
```

### 步骤 5：测试

```bash
# 测试健康检查
curl http://localhost:5001/api/health

# 如果正常，应该返回：
# {"status":"ok","timestamp":"...","ai":"Claude 4.5 Sonnet","system":"Whale Cloud Interview Platform"}
```

---

## 🚀 方式二：直接部署（不使用 Docker）

### 步骤 1：安装 Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

### 步骤 2：上传并安装

```bash
# 1. 上传代码
scp -r /Users/chenhong/employee-culture-platform user@your-server:/opt/

# 2. SSH 登录
ssh user@your-server

# 3. 安装依赖
cd /opt/employee-culture-platform
npm install
npm run build

# 4. 创建环境变量
cat > .env << EOF
ANTHROPIC_AUTH_TOKEN=ailab_RQZwGRKuPwONzqJyRMhVeQkxYYex2lKu/AhRkMyKRY0ixPqp9ya60MWwL8ffvDV6JLia+weHUMrF8AdmnFnVrfWTd1INneGvdnkzb7pypmma0inl7HVvEvE=
ANTHROPIC_BASE_URL=https://lab.iwhalecloud.com/gpt-proxy/anthropic
ANTHROPIC_MODEL=claude-4.5-sonnet
NODE_ENV=production
PORT=5001
ADMIN_PASSWORD=whale2026
EOF

# 5. 安装 PM2（进程管理）
sudo npm install -g pm2

# 6. 启动应用
pm2 start npm --name "whale-interview" -- run start

# 7. 设置开机自启
pm2 startup
pm2 save

# 8. 查看状态
pm2 status
pm2 logs whale-interview
```

---

## 🌐 配置 Nginx 反向代理

### 步骤 1：安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
```

### 步骤 2：配置

```bash
sudo nano /etc/nginx/sites-available/whale-interview
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 改成你的域名或 IP

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 步骤 3：启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/whale-interview /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx
```

---

## 🔒 配置 HTTPS（可选但推荐）

### 使用 Let's Encrypt 免费证书

```bash
# 1. 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# 2. 获取证书
sudo certbot --nginx -d your-domain.com

# 3. 自动续期
sudo systemctl enable certbot.timer
```

---

## 📊 监控和维护

### 查看应用状态

```bash
# Docker 方式
docker-compose ps
docker-compose logs -f

# PM2 方式
pm2 status
pm2 logs whale-interview
```

### 重启应用

```bash
# Docker 方式
docker-compose restart

# PM2 方式
pm2 restart whale-interview
```

### 更新应用

```bash
# 1. 拉取最新代码
cd /opt/employee-culture-platform
git pull

# 2. Docker 方式
docker-compose down
docker-compose build
docker-compose up -d

# 3. PM2 方式
npm install
npm run build
pm2 restart whale-interview
```

---

## 🔧 故障排查

### 问题 1：无法访问

```bash
# 检查端口占用
sudo netstat -tlnp | grep 5001

# 检查防火墙
sudo ufw status
sudo ufw allow 5001
sudo ufw allow 80
sudo ufw allow 443
```

### 问题 2：AI 不响应

```bash
# 测试内网连接
curl https://lab.iwhalecloud.com/gpt-proxy/anthropic

# 查看应用日志
docker-compose logs | grep -i error
# 或
pm2 logs whale-interview --lines 100
```

### 问题 3：数据丢失

```bash
# 确保数据目录存在
mkdir -p /opt/employee-culture-platform/data

# 检查权限
sudo chown -R $USER:$USER /opt/employee-culture-platform/data
```

---

## 📦 完整部署脚本

保存为 `deploy.sh`:

```bash
#!/bin/bash

echo "🐋 Whale Cloud Interview Platform - 部署脚本"

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安装，请先安装"
    exit 1
fi

# 停止旧容器
echo "⏹️  停止旧容器..."
docker-compose down

# 构建新镜像
echo "🔨 构建新镜像..."
docker-compose build

# 启动容器
echo "🚀 启动容器..."
docker-compose up -d

# 等待启动
echo "⏳ 等待服务启动..."
sleep 5

# 测试健康检查
echo "🔍 测试服务..."
if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "✅ 部署成功！"
    echo "📱 访问地址：http://$(hostname -I | awk '{print $1}'):5001"
else
    echo "❌ 部署失败，请检查日志："
    echo "   docker-compose logs"
fi
```

使用方法：

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🎯 快速开始checklist

- [ ] 服务器准备就绪（能访问 lab.iwhalecloud.com）
- [ ] 安装 Docker 和 docker-compose
- [ ] 上传代码到服务器
- [ ] 创建 Dockerfile 和 docker-compose.yml
- [ ] 运行 docker-compose up -d
- [ ] 配置 Nginx（可选）
- [ ] 配置 HTTPS（可选）
- [ ] 测试访问
- [ ] 分享给员工

---

需要帮助随时告诉我！
