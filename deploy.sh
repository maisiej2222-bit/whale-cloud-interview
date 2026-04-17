#!/bin/bash

# Whale Cloud Interview Platform - 一键部署脚本
# 适用于公司内网服务器

set -e  # 遇到错误立即退出

echo "🐋 ============================================"
echo "🐋  Whale Cloud Interview Platform"
echo "🐋  自动部署脚本"
echo "🐋 ============================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 Docker
echo "📦 检查 Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装${NC}"
    echo ""
    echo "请先安装 Docker:"
    echo "  Ubuntu/Debian: curl -fsSL https://get.docker.com | bash"
    echo "  CentOS: yum install docker-ce docker-ce-cli containerd.io"
    exit 1
fi
echo -e "${GREEN}✅ Docker 已安装${NC}"

# 检查 docker-compose
echo "📦 检查 docker-compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose 未安装${NC}"
    echo ""
    echo "请先安装 docker-compose:"
    echo "  sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "  sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi
echo -e "${GREEN}✅ docker-compose 已安装${NC}"
echo ""

# 检查内网连接
echo "🌐 检查内网连接..."
if curl -s --max-time 5 https://lab.iwhalecloud.com/gpt-proxy/anthropic > /dev/null; then
    echo -e "${GREEN}✅ 可以访问内网代理${NC}"
else
    echo -e "${YELLOW}⚠️  无法访问 lab.iwhalecloud.com${NC}"
    echo "   确保服务器在公司内网或配置了 VPN"
    read -p "是否继续部署？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# 停止旧容器
echo "⏹️  停止旧容器..."
docker-compose down 2>/dev/null || true
echo ""

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build
echo ""

# 启动容器
echo "🚀 启动容器..."
docker-compose up -d
echo ""

# 等待服务启动
echo "⏳ 等待服务启动（30秒）..."
sleep 30

# 检查容器状态
echo "📊 检查容器状态..."
docker-compose ps
echo ""

# 健康检查
echo "🔍 测试服务健康状态..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s http://localhost:5001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 服务运行正常！${NC}"
        echo ""

        # 获取服务器 IP
        SERVER_IP=$(hostname -I | awk '{print $1}')

        echo "🎉 ============================================"
        echo "🎉  部署成功！"
        echo "🎉 ============================================"
        echo ""
        echo "📱 访问地址："
        echo "   内网: http://$SERVER_IP:5001"
        echo "   本地: http://localhost:5001"
        echo ""
        echo "👤 管理员密码: whale2026"
        echo ""
        echo "📝 常用命令："
        echo "   查看日志: docker-compose logs -f"
        echo "   重启服务: docker-compose restart"
        echo "   停止服务: docker-compose down"
        echo "   查看状态: docker-compose ps"
        echo ""
        exit 0
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   尝试 $RETRY_COUNT/$MAX_RETRIES..."
    sleep 5
done

# 如果到这里说明失败了
echo -e "${RED}❌ 部署失败！${NC}"
echo ""
echo "请检查日志："
echo "  docker-compose logs"
echo ""
echo "常见问题："
echo "  1. 端口 5001 被占用：lsof -i:5001"
echo "  2. 无法访问内网：ping lab.iwhalecloud.com"
echo "  3. Docker 权限问题：sudo usermod -aG docker \$USER"
exit 1
