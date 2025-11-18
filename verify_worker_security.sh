#!/bin/bash
# Worker安全路由验证脚本
# 用法: ./verify_worker_security.sh [base_url]
# 示例: ./verify_worker_security.sh http://localhost:3000

BASE_URL=${1:-"http://localhost:3000"}
echo "使用基础URL: $BASE_URL"
echo "========================================"

# 测试允许的worker访问
echo "1. 测试允许的worker访问 (应该成功):"
echo "   Worker 0: $BASE_URL/w0/test"
curl -s "$BASE_URL/w0/test" | head -c 100 || echo "请求已发送"

echo -e "\n   Worker 1: $BASE_URL/w1/test"
curl -s "$BASE_URL/w1/test" | head -c 100 || echo "请求已发送"

# 测试被阻止的worker访问
echo -e "\n2. 测试被阻止的worker访问 (应该返回403):"
echo "   Worker 2: $BASE_URL/w2/test"
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/w2/test"

echo -e "\n   Worker 5: $BASE_URL/w5/test"
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/w5/test"

echo -e "\n   Worker 100: $BASE_URL/w100/test"
curl -s -w "\nHTTP Status: %{http_code}\n" "$BASE_URL/w100/test"

# 测试非worker路由不受影响
echo -e "\n3. 测试非worker路由 (应该正常工作):"
echo "   API env: $BASE_URL/api/env"
curl -s "$BASE_URL/api/env"

echo -e "\n========================================"
echo "验证完成！如果被阻止的worker返回403状态码且包含'Worker not available'错误消息，则安全修复工作正常。"
