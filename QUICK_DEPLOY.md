# ⚡ 快速部署指南 - 5分钟上线

本指南帮助你快速将 Whale Cloud 采访平台部署到云端，无需本地电脑运行。

---

## 🚀 推荐方案：Railway（最简单，5分钟完成）

### 为什么选择 Railway？
- ✅ **完全免费**：每月 $5 免费额度，足够使用
- ✅ **一键部署**：从 GitHub 自动部署
- ✅ **自动 HTTPS**：Railway 自动配置 SSL 证书
- ✅ **无需服务器知识**：图形化界面操作

---

## 📝 部署步骤

### 第 1 步：准备 GitHub 仓库

```bash
# 进入项目目录
cd /Users/chenhong/employee-culture-platform

# 初始化 Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Ready for deployment"

# 在 GitHub 创建新仓库后，推送代码
git remote add origin https://github.com/你的用户名/whale-cloud-interview.git
git branch -M main
git push -u origin main
```

### 第 2 步：在 Railway 部署

1. **访问 Railway**
   - 打开 https://railway.app
   - 点击右上角 "Login" 
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 授权 Railway 访问你的 GitHub
   - 选择 `whale-cloud-interview` 仓库

3. **Railway 自动检测配置**
   - Railway 会自动识别 Node.js 项目
   - 自动运行 `npm install` 和 `npm run build`
   - 自动执行 `npm start` 启动服务

### 第 3 步：配置环境变量

在 Railway 项目页面：

1. 点击项目名称
2. 选择 "Variables" 标签
3. 点击 "New Variable" 添加以下变量：

```
ANTHROPIC_AUTH_TOKEN = 你的Anthropic API密钥
ANTHROPIC_BASE_URL = https://api.anthropic.com
ANTHROPIC_MODEL = claude-4.5-sonnet-20250514
NODE_ENV = production
PORT = 5001
ADMIN_PASSWORD = whale2026
```

**重要**：`ANTHROPIC_AUTH_TOKEN` 必须填入你的真实密钥！

### 第 4 步：重新部署

- 添加环境变量后，点击 "Deploy" 按钮
- 或者点击右上角三个点 → "Redeploy"
- 等待 2-3 分钟构建完成

### 第 5 步：获取公网地址

- 在 "Settings" 标签中找到 "Domains"
- Railway 自动生成一个域名，例如：
  ```
  https://whale-cloud-interview-production.up.railway.app
  ```
- 这就是你的公网访问地址！

### 第 6 步：访问和测试

1. **打开公网地址**
   - 访问 Railway 提供的域名

2. **测试公开采访**
   - 默认就在 "Interview" 页面
   - 开始与 AI 对话
   - 测试完整采访流程

3. **测试管理员功能**
   - 点击 "Admin" 标签
   - 输入密码：`whale2026`
   - 查看采访记录

4. **分享给员工**
   - 将 Railway 域名发送给需要参与采访的员工
   - 他们可以直接访问，无需任何安装

---

## 🎯 后续更新

### 代码更新后如何重新部署？

```bash
# 本地修改代码后
git add .
git commit -m "Update something"
git push

# Railway 会自动检测更新并重新部署！
```

不需要手动操作，Railway 自动完成部署。

---

## 🔧 自定义域名（可选）

如果你有自己的域名：

1. 在 Railway 项目中点击 "Settings"
2. 找到 "Custom Domain"
3. 输入你的域名（如 `interview.whalecloud.com`）
4. 按照提示在域名 DNS 中添加 CNAME 记录
5. 等待 DNS 生效（通常几分钟到 1 小时）

---

## 💰 费用说明

### Railway 免费计划
- **月度额度**：$5 免费 credit
- **使用场景**：约 500 小时运行时间
- **是否够用**：对于采访平台完全足够
- **超出后**：可升级到 $5/月 Hobby 计划

### 成本估算
- 假设每天 10 个采访，每个 15 分钟
- 每月约 50 小时活跃时间
- **完全在免费额度内** ✅

---

## 🆘 常见问题

### Q1：构建失败怎么办？

**查看日志**：
1. 在 Railway 项目中点击 "Deployments"
2. 点击失败的部署
3. 查看 "Build Logs" 和 "Deploy Logs"

**常见原因**：
- 环境变量未配置
- package.json 有错误
- Node.js 版本不匹配

### Q2：访问很慢或超时？

**原因**：Railway 服务器在美国，国内访问可能较慢

**解决方案**：
- 使用阿里云/腾讯云部署（参考 DEPLOY.md）
- 或者使用 Cloudflare CDN 加速

### Q3：如何查看应用日志？

在 Railway 项目中：
1. 点击 "Deployments" 标签
2. 选择最新的部署
3. 查看 "Logs" 实时输出

### Q4：如何停止/删除项目？

1. 在 Railway 项目中点击 "Settings"
2. 滚动到底部
3. 点击 "Delete Service"

### Q5：忘记管理员密码怎么办？

1. 在 Railway 项目的 "Variables" 中
2. 修改 `ADMIN_PASSWORD` 为新密码
3. 重新部署

---

## ✅ 部署检查清单

部署完成后，请逐项检查：

- [ ] 可以访问 Railway 域名
- [ ] 首页正常加载
- [ ] 点击 "Interview" 标签可以开始对话
- [ ] AI 回复正常（测试发送一条消息）
- [ ] 完成采访后生成聚焦内容
- [ ] 点击 "Admin" 标签可以登录
- [ ] 输入密码 `whale2026` 可以进入管理后台
- [ ] 可以查看采访记录列表
- [ ] 点击 👁️ 可以查看详情
- [ ] 点击 📥 可以下载 Word 文档

---

## 🎉 完成！

现在你的采访平台已经：
- ✅ 部署在云端，24/7 运行
- ✅ 拥有公网地址，任何人都可以访问
- ✅ 自动 HTTPS 加密
- ✅ 代码更新自动部署

**将你的 Railway 域名分享给员工，开始收集精彩的员工故事吧！** 🚀

---

## 📞 需要帮助？

- 📖 详细部署指南：查看 `DEPLOY.md`
- 🐛 遇到问题：检查 Railway Logs
- 💬 API 错误：确认环境变量配置正确
