#!/bin/bash

echo "==================================="
echo "AI 分析器测试脚本"
echo "==================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 API key
if [ -z "$APP__AI_ANALYZER__API_KEY" ]; then
    echo -e "${YELLOW}警告：环境变量 APP__AI_ANALYZER__API_KEY 未设置${NC}"
    echo ""
    echo "请设置您的 OpenRouter API key："
    echo ""
    echo "方法1 - 临时设置（当前终端有效）："
    echo "export APP__AI_ANALYZER__API_KEY=\"your-api-key-here\""
    echo ""
    echo "方法2 - 写入 .env 文件："
    echo "echo 'APP__AI_ANALYZER__API_KEY=your-api-key-here' > .env"
    echo ""
    echo -e "${YELLOW}注意：不要将 API key 提交到代码仓库！${NC}"
    echo ""
    read -p "请输入您的 OpenRouter API key（或按 Ctrl+C 退出）: " api_key
    export APP__AI_ANALYZER__API_KEY="$api_key"
    echo "export APP__AI_ANALYZER__API_KEY=\"$api_key\"" > .env
    echo -e "${GREEN}✓ 已创建 .env 文件${NC}"
else
    echo -e "${GREEN}✓ 环境变量已设置${NC}"
    echo "API key 末尾：****${APP__AI_ANALYZER__API_KEY: -4}"
fi

echo ""
echo "==================================="
echo "启动服务器..."
echo "==================================="
echo ""
echo "启动后，查看日志确认 API key 是否被正确读取"
echo "然后在浏览器中访问前端测试 AI 分析功能"
echo ""

# 启动服务器
RUST_LOG=info cargo run
