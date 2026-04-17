# 🐋 Whale Cloud Interview Platform

**员工文化聚焦采访平台** - Employee Spotlight Series 2026

一个基于 AI 的智能采访平台，用于收集和展示员工故事，由 Claude 4.5 Sonnet 提供技术支持。

---

## ✨ 功能特点

### 🎤 公开采访页面
- 无需登录，任何人都可参与
- AI 智能对话，自然流畅的采访体验
- 自动收集 11 个关键信息点
- 生成专业的员工聚焦内容
- 一键复制所有内容板块

### 🔐 管理员后台
- 密码保护的管理界面
- 查看所有采访记录
- 完整的对话历史
- 一键下载 Word 文档
- 删除管理功能

### 📄 生成内容格式
- 标题 (Title)
- 座右铭 (Motto)
- 个人介绍 (Introduction)
- 主要成就 (Achievement)
- 问答环节 (Q&A Session)
- AI 洞察 (AI Insight)

---

## 🚀 快速开始

### 本地开发

```bash
# 1. 克隆项目
git clone <repository-url>
cd employee-culture-platform

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 Anthropic API Key

# 4. 启动后端服务器
npm run server

# 5. 在新终端启动前端开发服务器
npm run dev

# 6. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:5001
```

### 生产部署

详见 [DEPLOY.md](./DEPLOY.md) 获取完整部署指南。

**推荐平台**：
- Railway.app（最简单）
- Render.com（免费额度充足）
- 阿里云/腾讯云（国内访问快）

---

## 🔧 技术栈

### 前端
- React 18
- Vite
- Axios
- Lucide React (图标)

### 后端
- Node.js + Express
- Anthropic Claude 4.5 Sonnet AI
- docx (Word 文档生成)

### 部署
- 支持 Railway, Render, Vercel
- 支持传统云服务器 (阿里云, 腾讯云, AWS)

---

## 📋 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# Anthropic Claude API
ANTHROPIC_AUTH_TOKEN=your_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_MODEL=claude-4.5-sonnet-20250514

# 服务器配置
PORT=5001
NODE_ENV=development

# 管理员密码
ADMIN_PASSWORD=whale2026
```

---

## 📖 使用指南

### 员工参与采访

1. 访问公开 URL
2. 点击 "Interview" 标签
3. 与 AI 进行自然对话
4. 回答关于工作经历、成就、文化观点等问题
5. 完成后自动生成聚焦内容
6. 复制所需内容板块

### 管理员操作

1. 访问平台 URL
2. 点击 "Admin" 标签
3. 输入密码：`whale2026`
4. 查看所有采访记录
5. 点击 👁️ 查看详情
6. 点击 📥 下载 Word 文档
7. 点击 🗑️ 删除记录

---

## 🔒 安全注意事项

1. **生产环境必须修改管理员密码**
   - 在 `.env` 文件中设置 `ADMIN_PASSWORD`
   
2. **保护 API 密钥**
   - 绝不将 `.env` 文件提交到 Git
   - 使用云平台的环境变量管理功能

3. **HTTPS 部署**
   - Railway 和 Render 自动提供 HTTPS
   - 自建服务器请配置 SSL 证书

---

## 📊 采访数据收集

平台自动收集以下 11 个信息点：

1. 基本信息：姓名、工号、入职时间
2. 团队部门、职位、当前角色
3. 个人座右铭
4. 主要项目和贡献
5. 最自豪的成就
6. 对公司文化的看法
7. 跨文化协作经验
8. AI 工具使用情况
9. 对 AI 的看法
10. 职业成长经历
11. 给团队的建议

---

## 🛠 开发命令

```bash
# 开发模式（前端）
npm run dev

# 构建生产版本
npm run build

# 启动后端服务器
npm run server

# 生产模式启动
npm run start

# 构建并启动
npm run deploy
```

---

## 📁 项目结构

```
employee-culture-platform/
├── src/                      # 前端源代码
│   ├── components/          # React 组件
│   │   ├── PublicInterview.jsx
│   │   ├── PublicInterview.css
│   │   ├── AdminPanel.jsx
│   │   └── AdminPanel.css
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── server/                   # 后端服务器
│   ├── index.js             # Express 服务器
│   └── package.json
├── data/                     # 采访数据存储 (gitignored)
├── dist/                     # 构建输出 (gitignored)
├── .env                      # 环境变量 (gitignored)
├── .env.example             # 环境变量示例
├── package.json
├── vite.config.js
├── DEPLOY.md                # 部署指南
└── README.md                # 本文件
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License

---

## 📞 支持

如有问题或需要帮助，请参考：
- [部署指南](./DEPLOY.md)
- [环境变量配置](#环境变量配置)

---

**由 Whale Cloud Technology 打造 | Powered by Claude 4.5 Sonnet** 🐋✨

