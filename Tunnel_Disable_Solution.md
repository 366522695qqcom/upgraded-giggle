# 临时禁用Cloudflare隧道方案

## 🚨 当前问题

应用启动时尝试创建Cloudflare隧道，但缺少CF_ACCOUNT_ID和CF_API_TOKEN。

## 💡 临时解决方案：禁用隧道功能

### 方法1: 修改代码跳过隧道创建

在`src/server/Server.ts`中注释掉隧道创建代码：

```typescript
// 注释掉这一行：
// await setupTunnels();

// 替换为：
console.log("Tunnel disabled - using direct connection");
```

### 方法2: 创建模拟环境变量

在Zeabur中设置：

```bash
CF_ACCOUNT_ID=dummy
CF_API_TOKEN=dummy
```

这将导致隧道创建失败，但应用会继续运行。

## 🎯 推荐方案

**短期**：使用方法2快速恢复服务
**长期**：获取真实Cloudflare凭证，实现完整的隧道功能

## 📖 隧道功能说明

Cloudflare隧道用于：

- 安全访问内部服务
- 提供HTTPS连接
- 避免直接暴露服务器端口
