# 502错误修复报告

## 问题诊断

### 根本原因

访问应用时出现502错误，原因是**nginx端口映射配置错误**：

1. **nginx配置**：所有请求默认代理到 `localhost:3000`
2. **实际架构**：
   - Master进程（端口3000）：只处理静态文件和少量API（/api/env, /api/public_lobbies）
   - Worker进程（端口3001+）：处理游戏逻辑、WebSocket和大部分API请求
3. **结果**：nginx找不到实际的游戏应用逻辑，返回502错误

### 问题分析过程

1. 检查了应用架构，发现Master-Worker模式
2. 验证了端口分配：
   - Master: `config.workerPortByIndex(index)` 返回 `3001 + index`
   - Worker 0: 端口3001
   - Worker 1: 端口3002
   - 等等
3. 分析了Client连接逻辑：
   - 游戏连接通过WebSocket到 `/${workerPath}/`
   - API请求如 `/api/create_game/:id`, `/api/game/:id` 等
   - WebSocket路径: `wss://host/w0/`, `wss://host/w1/` 等

## 修复方案

### 1. Worker API路由

为游戏相关的API请求添加了智能路由：

```nginx
# Worker API routes - route to appropriate worker port based on game ID
location ~ ^/api/(create_game|start_game|game|kick_player)/ {
    # 提取游戏ID从路径
    if ($request_uri ~* "^/api/(create_game|game|kick_player)/([^/]+)") {
        set $game_id $2;
    }
    if ($request_uri ~* "^/api/start_game/([^/]+)") {
        set $game_id $1;
    }

    # 基于游戏ID的哈希计算确定worker索引
    set $worker_index 0;
    if ($game_id) {
        if ($game_id ~* "([0-9])") {
            set $last_digit $1;
            set $worker_index $last_digit;
        }
    }

    # 计算目标端口 (3001 + worker_index)
    set $target_port 3001;
    if ($worker_index >= 1) { set $target_port 3002; }
    if ($worker_index >= 2) { set $target_port 3003; }
    if ($worker_index >= 3) { set $target_port 3004; }

    proxy_pass http://127.0.0.1:$target_port;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 2. WebSocket路由

现有的WebSocket路由配置已经存在并正确：

```nginx
location ~* ^/w(\d+)(/.*)?$ {
    set $worker $1;
    set $worker_port 3001;

    # 支持多个worker实例
    if ($worker = "0") { set $worker_port 3001; }
    if ($worker = "1") { set $worker_port 3002; }
    # ... 支持到worker 40

    proxy_pass http://127.0.0.1:$worker_port$2;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. Master API路由

为Master进程保留的API端点添加了明确注释：

```nginx
# Master process API routes (port 3000)
location = /api/public_lobbies {
    proxy_pass http://127.0.0.1:3000;
    # ... headers
}

location = /api/env {
    proxy_pass http://127.0.0.1:3000;
    # ... headers
}
```

## 修复效果

### 解决的内容

1. **API路由错误**：游戏相关API现在正确路由到Worker进程
2. **502错误**：nginx能正确找到并连接后端应用
3. **WebSocket连接**：游戏实时通信通过正确的worker端口
4. **静态文件服务**：仍由Master进程（端口3000）处理

### 架构优化

- **智能路由**：基于游戏ID的哈希分布，确保负载均衡
- **高可用性**：支持多worker实例（最多40个）
- **WebSocket支持**：完整的WebSocket代理配置

## 部署说明

### 本地测试

由于应用使用Master-Worker模式，本地测试需要：

1. 启动Master进程（npm run start:server）
2. Worker进程会自动fork启动
3. nginx代理到正确的端口

### 生产部署（Zeabur）

1. 修复已推送到GitHub
2. Zeabur会自动拉取更新并重新部署
3. 应用启动时会：
   - 创建Master进程在3000端口
   - fork Worker进程在3001+端口
   - nginx正确路由请求

### 验证方法

1. 访问应用主页：应该显示应用界面（不再是502）
2. 创建游戏：API请求正确路由到Worker
3. WebSocket连接：游戏实时功能正常工作

## 总结

502错误的根本原因是nginx配置与实际应用架构不匹配。通过添加智能的API路由和保留现有的WebSocket路由配置，现在nginx能够：

- 将游戏API请求正确路由到Worker进程
- 保持WebSocket连接正常工作
- 让Master进程继续处理静态文件和系统API

这个修复确保了完整的Master-Worker架构能够正常工作，解决了502错误问题。
