# 🚀 Whale Cloud Interview Platform - 云部署指南

本文档提供将应用部署到云服务器的完整指南，让应用可以独立于本地电脑运行。

---

## 📋 部署前准备

### 1. 必需的账号和密钥

- **Anthropic API Key**：已有（用于 Claude AI）
- **云平台账号**（选择以下任一）：
  - [Railway.app](https://railway.app) - 推荐，最简单
  - [Render.com](https://render.com) - 免费额度充足
  - [Vercel](https://vercel.com) - 适合前端
  - 阿里云/腾讯云 - 国内访问快

---

## 🎯 方案一：Railway 部署（推荐）

### 优点
- ✅ 完全免费（每月 $5 credit，足够使用）
- ✅ 一键部署，自动 HTTPS
- ✅ 国际访问速度快
- ✅ 支持 GitHub 自动部署

### 部署步骤

#### 1. 准备代码仓库

```bash
cd /Users/chenhong/employee-culture-platform

# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Initial commit for deployment"

# 推送到 GitHub
# 先在 GitHub 创建新仓库，然后执行：
git remote add origin https://github.com/你的用户名/whale-cloud-interview.git
git branch -M main
git push -u origin main
```

#### 2. 在 Railway 部署

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 账号登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择你的仓库：`whale-cloud-interview`
5. Railway 会自动检测配置并开始部署

#### 3. 配置环境变量

在 Railway 项目中：
1. 进入 "Variables" 标签
2. 添加以下环境变量：

```
ANTHROPIC_AUTH_TOKEN=你的Anthropic密钥
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-4.5-sonnet-20250514
NODE_ENV=production
PORT=5001
ADMIN_PASSWORD=whale2026
```

#### 4. 重新部署

- 点击 "Deploy" 重新部署
- 等待 2-3 分钟构建完成
- Railway 会自动分配一个公网域名，例如：`https://whale-cloud-interview-production.up.railway.app`

#### 5. 访问应用

打开分配的域名，应用即可使用！

---

## 🎯 方案二：Render 部署

### 优点
- ✅ 免费计划（有限制但够用）
- ✅ 简单易用
- ✅ 自动 HTTPS

### 部署步骤

#### 1. 创建 render.yaml 配置文件

在项目根目录创建 `render.yaml`：

```yaml
services:
  - type: web
    name: whale-cloud-interview
    env: node
    region: oregon
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: ANTHROPIC_AUTH_TOKEN
        sync: false
      - key: ANTHROPIC_BASE_URL
        value: https://api.anthropic.com
      - key: ANTHROPIC_MODEL
        value: claude-4.5-sonnet-20250514
      - key: NODE_ENV
        value: production
      - key: ADMIN_PASSWORD
        value: whale2026
```

#### 2. 推送到 GitHub

```bash
git add render.yaml
git commit -m "Add Render deployment config"
git push
```

#### 3. 在 Render 部署

1. 访问 [render.com](https://render.com)
2. 注册/登录账号
3. 点击 "New +" → "Web Service"
4. 连接 GitHub 仓库
5. Render 会自动检测 render.yaml 配置
6. 点击 "Create Web Service"

#### 4. 添加环境变量

在 Render 控制台：
- 进入 "Environment" 标签
- 添加 `ANTHROPIC_AUTH_TOKEN`（你的实际密钥）

#### 5. 等待部署完成

- 首次部署约 5-10 分钟
- 完成后会获得类似 `https://whale-cloud-interview.onrender.com` 的域名

---

## 🎯 方案三：Vercel + Railway（前后端分离）

### 前端部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd /Users/chenhong/employee-culture-platform
vercel --prod
```

### 后端部署到 Railway

按照方案一部署后端，然后在前端代码中配置后端 API 地址。

---

## 🎯 方案四：阿里云/腾讯云（国内推荐）

### 适合场景
- 主要用户在中国
- 需要备案的正式项目
- 需要更高的稳定性

### 部署步骤

#### 1. 购买云服务器

- **阿里云 ECS** 或 **腾讯云 CVM**
- 推荐配置：1核2G，带宽1M（够用）
- 系统：Ubuntu 22.04 LTS

#### 2. 连接服务器并安装环境

```bash
# SSH 连接服务器
ssh root@你的服务器IP

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2（进程管理）
npm install -g pm2

# 安装 Git
sudo apt-get install git -y
```

#### 3. 部署应用

```bash
# 克隆代码
cd /var/www
git clone https://github.com/你的用户名/whale-cloud-interview.git
cd whale-cloud-interview

# 安装依赖
npm install

# 构建前端
npm run build

# 创建环境变量文件
nano .env
# 粘贴你的环境变量配置
# 按 Ctrl+X, Y, Enter 保存

# 使用 PM2 启动应用
pm2 start npm --name "whale-interview" -- run start
pm2 save
pm2 startup
```

#### 4. 配置 Nginx 反向代理

```bash
# 安装 Nginx
sudo apt-get install nginx -y

# 创建配置文件
sudo nano /etc/nginx/sites-available/whale-interview
```

配置内容：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/whale-interview /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. 配置 HTTPS（可选）

```bash
# 安装 Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# 获取 SSL 证书
sudo certbot --nginx -d 你的域名
```

#### 6. 访问应用

- HTTP: `http://你的服务器IP`
- HTTPS: `https://你的域名`（如果配置了）

---

## 📱 部署后检查清单

- [ ] 访问主页，确认前端加载正常
- [ ] 测试公开采访功能，AI 对话正常
- [ ] 测试管理员登录（密码：whale2026）
- [ ] 查看采访记录列表
- [ ] 下载 Word 文档功能正常
- [ ] 生成的海报内容格式正确

---

## 🔧 常见问题

### 1. 部署后 API 请求失败

**原因**：环境变量未正确配置

**解决**：检查 `ANTHROPIC_AUTH_TOKEN` 是否正确设置

### 2. Railway/Render 免费额度用完

**Railway**：每月 $5 credit，通常够用。超出后可以升级付费计划（$5/月起）

**Render**：免费实例会在无活动时休眠，首次访问需要等待 30 秒唤醒

### 3. 构建失败

**检查**：
- package.json 是否正确
- Node.js 版本是否 >= 18
- 环境变量是否都已配置

### 4. 国内访问速度慢

**解决方案**：
- 使用阿里云/腾讯云部署
- 或使用 CDN 加速

---

## 💡 推荐配置总结

| 场景 | 推荐方案 | 成本 | 部署难度 |
|------|---------|------|---------|
| 快速测试 | Railway | 免费 | ⭐ 最简单 |
| 长期免费使用 | Render | 免费 | ⭐⭐ 简单 |
| 国内用户为主 | 阿里云/腾讯云 | ¥50-100/月 | ⭐⭐⭐ 中等 |
| 企业级应用 | AWS/阿里云 | 按需计费 | ⭐⭐⭐⭐ 复杂 |

---

## 📞 需要帮助？

如果部署过程中遇到问题：
1. 检查服务器日志
2. 确认环境变量配置
3. 查看本文档对应章节

---

**部署完成后，请将最终的访问URL分享给需要参与采访的员工！** 🎉
