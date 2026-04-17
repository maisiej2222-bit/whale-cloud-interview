# 使用 Node.js 20 Alpine 作为基础镜像
FROM node:20-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，用于构建）
RUN npm install --cache /tmp/npm-cache

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# ===== 生产镜像 =====
FROM node:20-alpine

WORKDIR /app

# 复制 package.json
COPY package*.json ./
COPY server/package*.json ./server/

# 只安装生产依赖
RUN npm install --production --cache /tmp/npm-cache && \
    cd server && npm install --production --cache /tmp/npm-cache

# 从构建阶段复制构建产物
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/index.html ./index.html

# 创建数据目录
RUN mkdir -p /app/data

# 暴露端口
EXPOSE 5001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5001

# 启动应用
CMD ["node", "server/index.js"]
