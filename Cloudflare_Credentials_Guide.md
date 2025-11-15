# Cloudflare凭证获取完整指南

## 📋 概述

要启用完整的Cloudflare隧道功能，您需要获取两个关键凭证：

- CF_ACCOUNT_ID (账户ID)
- CF_API_TOKEN (API令牌)

## 🔍 步骤1: 获取CF_ACCOUNT_ID

### 方法1: 通过Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 在右侧边栏，点击您的头像
3. 在"Account ID"行中点击"Click to reveal"
4. 复制显示的Account ID

### 方法2: 通过API获取

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔑 步骤2: 获取CF_API_TOKEN

### 2.1 创建API Token

1. 进入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 点击右上角头像 → "My Profile"
3. 点击左侧"API Tokens"
4. 点击"Create Token"

### 2.2 选择Token类型

**推荐方案：Custom Token**

- 点击"Custom token"
- 点击"Get started"

### 2.3 设置Token权限

在"Permissions"部分添加：

#### 权限1：Cloudflare Tunnel

- **Type**: Account
- **Resource**: Include All accounts
- **Permission**: Cloudflare Tunnel - Edit

#### 权限2：Zone (可选)

- **Type**: Zone
- **Resource**: Include All zones
- **Permission**: Cloudflare Tunnel - Edit

### 2.4 设置Client IP Address Filtering (可选)

如果您希望限制Token只能从特定IP使用：

- 在"Client IP Address Filtering"中添加您的服务器IP

### 2.5 设置Token TTL

- **Start date**: 立即生效
- **End date**: 选择合适过期时间（建议1年）

### 2.6 创建并保存Token

1. 点击"Continue to summary"
2. 检查权限设置
3. 点击"Create Token"
4. **重要**: 立即复制显示的Token（只显示一次）

## ⚙️ 步骤3: 在Zeabur中配置

### 3.1 添加环境变量

在Zeabur控制台中，添加以下环境变量：

```bash
# 替换为您的实际凭证
CF_ACCOUNT_ID=your_account_id_here
CF_API_TOKEN=your_api_token_here

# 确保这些是"Secret"类型
```

### 3.2 验证配置

1. 保存环境变量
2. 重新部署应用
3. 检查日志确认隧道创建成功

## 🔒 安全建议

### Token安全

- ✅ 使用自定义Token而非Global API Key
- ✅ 设置IP限制（如果可能）
- ✅ 定期轮换Token
- ✅ 监控Token使用情况
- ❌ 不要在代码中硬编码Token
- ❌ 不要将Token提交到版本控制

### 权限最小化

- 只授予必要的权限
- 定期审计Token权限
- 删除不再使用的Token

## 🛠️ 故障排除

### 常见错误

#### 1. "Invalid API Token"

**原因**: Token格式错误或已过期
**解决**:

- 检查Token是否正确复制
- 确认Token未过期
- 重新创建Token

#### 2. "Permission denied"

**原因**: Token权限不足
**解决**:

- 确认Token包含"Cloudflare Tunnel - Edit"权限
- 检查账户资源访问权限

#### 3. "Account not found"

**原因**: Account ID错误
**解决**:

- 重新获取Account ID
- 确认Account ID格式正确

### 测试API连接

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

**成功响应示例**:

```json
{
  "result": {
    "id": "your_account_id",
    "name": "your_account_name"
  },
  "success": true,
  "errors": [],
  "messages": []
}
```

## 🎯 完成后的状态

配置成功后，您应该能看到：

- 隧道创建成功日志
- HTTPS连接正常工作
- 安全访问内部服务

## 📞 需要帮助？

如果遇到问题，请检查：

1. Token权限是否正确
2. Account ID是否准确
3. 网络连接是否正常
4. Cloudflare账户状态是否正常
