# Zeabur 环境变量配置指南

## 🚀 必需环境变量（立即设置）

### 核心启动变量（容器启动必需）

```bash
DOMAIN=openfront.dev
SUBDOMAIN=main
GAME_ENV=staging
```

### 必需环境变量（应用运行必需）

```bash
# Cloudflare Tunnel (创建隧道必需)
# 获取方式详见 Cloudflare_Credentials_Guide.md
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_API_TOKEN=your_cloudflare_api_token
```

### 可选环境变量（按需设置）

#### 云服务配置

```bash
# Cloudflare Tunnel (生产环境推荐)
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_API_TOKEN=your_cloudflare_api_token

# Cloudflare R2 存储
R2_ACCESS_KEY=your_r2_access_key
R2_SECRET_KEY=your_r2_secret_key
R2_BUCKET=your-bucket-name

# Stripe 支付 (如需付费功能)
STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

#### 应用程序配置

```bash
# API 配置
API_KEY=your_api_key
ADMIN_TOKEN=your_admin_token
API_DOMAIN=api.openfront.dev

# 监控配置
OTEL_EXPORTER_OTLP_ENDPOINT=your_otlp_endpoint
OTEL_AUTH_HEADER=your_otlp_auth

# Git 信息
GIT_COMMIT=latest
```

#### 部署配置

```bash
# 容器运行
WORKER_ID=1
HOST=your-host
HOSTNAME=your-hostname
```

## 🔧 Zeabur 部署设置

### 1. Build Configuration

- **Build Command**: `npm run build-prod`
- **Root Directory**: `./` (项目根目录)

### 2. Deploy Configuration

- **Dockerfile Path**: `./Dockerfile`
- **Start Command**: **留空** (使用Dockerfile的ENTRYPOINT)

### 3. Environment Variables

在 Zeabur 控制台中设置：

```
DOMAIN: openfront.dev
SUBDOMAIN: main
GAME_ENV: staging
API_DOMAIN: api.openfront.dev (可选)
```

## ⚠️ 重要注意事项

1. **Dockerfile ENTRYPOINT**: 确保Zeabur使用Dockerfile的ENTRYPOINT而不是直接运行Node.js
2. **环境变量命名**: 变量名必须完全匹配（区分大小写）
3. **重启服务**: 修改环境变量后需要重启服务

## 🧪 测试配置

设置完成后，检查容器启动日志：

- 应该看到: "Using supervisord: /usr/sbin/supervisord"
- 不应该看到: Node.js尝试require supervisord的错误
