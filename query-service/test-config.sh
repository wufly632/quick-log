#!/bin/bash

echo "==================================="
echo "测试配置加载"
echo "==================================="
echo ""

# 检查.env文件
echo "1. 检查 .env 文件："
if [ -f .env ]; then
    echo "   ✓ .env 文件存在"
    echo "   内容预览："
    cat .env | grep -v "^#" | head -1 | sed 's/.*/   &/' | sed 's/APP__AI_ANALYZER__API_KEY=.*/APP__AI_ANALYZER__API_KEY=***隐藏***/'
else
    echo "   ✗ .env 文件不存在"
    echo "   请运行: cp .env.example .env"
    exit 1
fi

echo ""
echo "2. 加载环境变量："
source .env

if [ -z "$APP__AI_ANALYZER__API_KEY" ]; then
    echo "   ✗ 环境变量未加载"
    exit 1
else
    echo "   ✓ 环境变量已加载"
    echo "   API key 末尾：****${APP__AI_ANALYZER__API_KEY: -10}"
fi

echo ""
echo "3. 测试服务器启动（只显示配置日志）："
echo "   启动中..."
echo ""

# 运行服务器并捕获输出，但只显示AI配置相关日志
RUST_LOG=info cargo run 2>&1 | grep -E "(AI Analyzer|API Key|Starting server)" | head -20
