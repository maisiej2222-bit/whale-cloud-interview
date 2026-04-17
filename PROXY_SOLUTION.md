# 临时方案：本地代理 + Railway

## 原理
1. 在你的电脑（能访问内网）运行代理服务
2. 使用 ngrok 暴露到公网
3. Railway 通过 ngrok 访问你的代理

## 步骤

### 1. 创建本地代理服务器

创建文件 `/Users/chenhong/anthropic-proxy/proxy.js`:

```javascript
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: 'ailab_RQZwGRKuPwONzqJyRMhVeQkxYYex2lKu/AhRkMyKRY0ixPqp9ya60MWwL8ffvDV6JLia+weHUMrF8AdmnFnVrfWTd1INneGvdnkzb7pypmma0inl7HVvEvE=',
  baseURL: 'https://lab.iwhalecloud.com/gpt-proxy/anthropic'
});

app.post('/v1/messages', async (req, res) => {
  try {
    const response = await anthropic.messages.create(req.body);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Proxy running on http://localhost:3001');
});
```

### 2. 安装依赖并启动

```bash
cd /Users/chenhong/anthropic-proxy
npm init -y
npm install express @anthropic-ai/sdk cors
node proxy.js
```

### 3. 使用 ngrok 暴露

```bash
ngrok http 3001
```

会得到类似：`https://xxxx.ngrok.io`

### 4. 更新 Railway 环境变量

```
ANTHROPIC_BASE_URL = https://xxxx.ngrok.io
ANTHROPIC_AUTH_TOKEN = dummy（不重要，代理会处理）
```

## 缺点
- 需要你的电脑一直开着
- 不稳定
- 仅适合测试

## 长期方案
还是推荐使用官方 Anthropic API
