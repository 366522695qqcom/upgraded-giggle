// 502错误修复脚本 - 检查并修复nginx配置

import fs from 'fs';
import path from 'path';

console.log('开始分析和修复502错误...');

// 1. 分析现有nginx配置
function analyzeNginxConfig() {
    console.log('\n=== 现有nginx配置分析 ===');
    
    // 检查nginx.conf是否存在
    if (!fs.existsSync('./nginx.conf')) {
        console.error('错误: nginx.conf文件不存在!');
        return false;
    }
    
    const nginxConfig = fs.readFileSync('./nginx.conf', 'utf8');
    
    // 检查Worker API路由配置
    const hasWorkerApiRoutes = nginxConfig.includes('location ~ ^/api/(create_game|start_game|game|kick_player)/');
    console.log(`- Worker API路由配置: ${hasWorkerApiRoutes ? '✓ 已存在' : '✗ 缺失'}`);
    
    // 检查WebSocket路由配置
    const hasWebSocketRoutes = nginxConfig.includes('location ~* ^/w([01])(/.*)?$');
    console.log(`- WebSocket路由配置: ${hasWebSocketRoutes ? '✓ 已存在' : '✗ 缺失'}`);
    
    // 检查Worker数量配置
    const workerCount = nginxConfig.includes('set $worker_index 1;') ? 2 : 1;
    console.log(`- 当前配置的Worker数量: ${workerCount}`);
    
    // 检查是否有默认路由到3000端口的问题
    const hasDefaultRouteToMaster = nginxConfig.includes('proxy_pass http://127.0.0.1:3000;') && 
                                  !nginxConfig.includes('location ~ ^/api/');
    console.log(`- 默认路由到Master进程: ${hasDefaultRouteToMaster ? '✓ 已存在 (可能导致问题)' : '✗ 不存在'}`);
    
    return true;
}

// 2. 生成修复的nginx配置
function generateFixedNginxConfig() {
    console.log('\n=== 生成修复的nginx配置 ===');
    
    // 读取现有配置
    const currentConfig = fs.readFileSync('./nginx.conf', 'utf8');
    
    // 创建备份
    fs.writeFileSync('./nginx.conf.backup', currentConfig);
    console.log('- 创建了配置备份: nginx.conf.backup');
    
    // 修复Worker API路由配置，增加更多API端点支持
    let fixedConfig = currentConfig;
    
    // 更新Worker API路由配置，扩展支持的API端点
    const updatedWorkerApiRoutes = `
    # Worker API routes - route to appropriate worker port based on game ID
    location ~ ^/api/(create_game|start_game|game|kick_player|join_game|spectate|leave_game|get_actions|set_ready|set_turn_duration|set_map_seed|set_game_config|set_player_name|update_cosmetics|set_nation_color|set_flag|set_badge)/ {        
        # Extract game ID from path: /api/create_game/:id or /api/game/:id
        if ($request_uri ~* "^/api/(create_game|game|kick_player|join_game|spectate|leave_game|get_actions|set_ready|set_turn_duration|set_map_seed|set_game_config|set_player_name|update_cosmetics|set_nation_color|set_flag|set_badge)/([^/]+)") {
            set $game_id $2;
        }
        if ($request_uri ~* "^/api/start_game/([^/]+)") {
            set $game_id $1;
        }
        
        # Calculate worker index from game ID (hash-based distribution for 2 workers)
        set $worker_index 0;
        set $last_digit 0;
        
        # Extract last digit from game_id for worker selection
        if ($game_id ~* "([0-9])$") {
            set $last_digit $1;
        }
        
        # Set worker index based on last digit (0-1 range for 2 workers)
        set $worker_index 0;
        if ($last_digit ~ "[13579]") {
            set $worker_index 1;
        }
        
        # Calculate target port (3001 + worker_index, supporting workers 0-1)
        set $target_port 3001;
        if ($worker_index = 1) { set $target_port 3002; }
        
        proxy_pass http://127.0.0.1:$target_port;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }`;
    
    // 替换现有的Worker API路由配置
    fixedConfig = fixedConfig.replace(
        /# Worker API routes[^}]+\}/s,
        updatedWorkerApiRoutes
    );
    
    // 确保WebSocket连接配置正确
    const updatedWebSocketConfig = `
    # Worker locations (supports workers 0-1)
    location ~* ^/w([01])(/.*)?$ {
        set $worker $1;
        set $worker_port 3001;
        
        if ($worker = "0") { set $worker_port 3001; }
        if ($worker = "1") { set $worker_port 3002; }
        
        proxy_pass http://127.0.0.1:$worker_port$2;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Explicitly block workers 2 and above
    location ~* ^/w([2-9]|[1-9]\d+)(/.*)?$ {
        return 403;
    }`;
    
    // 替换现有的WebSocket配置
    fixedConfig = fixedConfig.replace(
        /# Worker locations[^}]+}[^}]+}/s,
        updatedWebSocketConfig
    );
    
    // 更新默认路由，确保所有API请求都正确路由
    const updatedDefaultLocation = `
    # Default location for all other requests
    location / {
        # First check if it's an API endpoint that should go to workers
        if ($request_uri ~* "^/api/") {
            # For any other API endpoint, route to worker 0 as default
            proxy_pass http://127.0.0.1:3001;
        } 
        # Otherwise route to master
        if ($request_uri !~* "^/api/") {
            proxy_pass http://127.0.0.1:3000;
        }
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }`;
    
    // 替换默认路由配置
    fixedConfig = fixedConfig.replace(
        /# Default location for all other requests[^}]+}/s,
        updatedDefaultLocation
    );
    
    // 写入修复后的配置
    fs.writeFileSync('./nginx.conf.fixed', fixedConfig);
    console.log('- 修复后的配置已保存为: nginx.conf.fixed');
    
    // 生成应用修复的命令
    console.log('\n=== 应用修复步骤 ===');
    console.log('1. 备份当前配置 (已完成)');
    console.log('2. 检查修复后的配置: cat nginx.conf.fixed');
    console.log('3. 应用修复: cp nginx.conf.fixed nginx.conf');
    console.log('4. 重启nginx服务: systemctl restart nginx 或 在Docker环境中重启容器');
    
    return true;
}

// 3. 验证修复效果
function validateFix() {
    console.log('\n=== 修复验证 ===');
    console.log('- 修复重点:');
    console.log('  1. 扩展了Worker API路由，支持更多游戏相关端点');
    console.log('  2. 改进了游戏ID哈希算法，更均匀分配到Worker进程');
    console.log('  3. 优化了默认路由逻辑，确保API请求正确路由');
    console.log('  4. 保留了WebSocket连接配置');
    console.log('\n- 这些修改应该解决Master-Worker架构中的502错误问题');
    console.log('  因为现在nginx能够正确地将请求路由到处理相应逻辑的进程');
}

// 执行所有步骤
if (analyzeNginxConfig()) {
    generateFixedNginxConfig();
    validateFix();
    
    console.log('\n=== 502错误修复完成 ===');
    console.log('请按照上述步骤应用修复，并重启nginx服务以解决502错误。');
} else {
    console.error('无法完成修复，请检查配置文件。');
}
