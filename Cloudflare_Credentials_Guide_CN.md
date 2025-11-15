# Cloudflare凭证获取完整指南（中文版）

## 📋 概述

要启用完整的Cloudflare隧道功能，您需要获取两个关键凭证：

- CF_ACCOUNT_ID (账户ID)
- CF_API_TOKEN (API令牌)

## 🔍 步骤1: 获取CF_ACCOUNT_ID

### 方法1: 通过Cloudflare控制面板

1. 登录 [Cloudflare控制面板](https://dash.cloudflare.com)
2. 在右侧边栏，点击您的头像
3. 在"Account ID"行中点击"Click to reveal"（点击显示）
4. 复制显示的Account ID

### 方法2: 通过API获取

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔑 步骤2: 获取CF_API_TOKEN

### 2.1 创建API令牌

1. 进入 [Cloudflare控制面板](https://dash.cloudflare.com)
2. 点击右上角头像 → "My Profile"（我的资料）
3. 点击左侧"API Tokens"（API令牌）
4. 点击"Create Token"（创建令牌）

### 2.2 选择令牌类型

**推荐方案：自定义令牌**

- 点击"Custom token"（自定义令牌）
- 点击"Get started"（开始使用）

### 2.3 设置令牌权限

在"Permissions"（权限）部分添加：

#### 权限1：Cloudflare Tunnel

- **Type**（类型）: Account（账户）
- **Resource**（资源）: Include All accounts（包含所有账户）
- **Permission**（权限）: Cloudflare Tunnel - Edit（编辑）

#### 权限2：Zone（区域）（可选）

- **Type**（类型）: Zone（区域）
- **Resource**（资源）: Include All zones（包含所有区域）
- **Permission**（权限）: Cloudflare Tunnel - Edit（编辑）

### 2.4 设置客户端IP地址过滤（可选）

如果您希望限制令牌只能从特定IP使用：

**重要：必须使用公网IP，不是本地IP！**

**为什么是公网IP？**

- API调用是通过互联网进行的，不是局域网
- Cloudflare只能看到您的公网出口IP
- 本地IP（如192.168.x.x, 10.x.x.x, 172.16-31.x.x）无法被Cloudflare识别

**如何获取您的公网IP：**

1. 访问 https://whatismyipaddress.com/ 或 https://ipinfo.io/
2. 显示的"IP Address"就是您的公网IP
3. 或者使用命令行：`curl ifconfig.me`

**在Cloudflare中设置：**

- 在"Client IP Address Filtering"中添加您的公网IP
- 格式如：`203.0.113.1`
- 可以添加多个IP，每个一行

**⚠️ 关于"运算符号"字段：**
在Cloudflare的IP过滤设置中，您可能会看到"Include"或"Exclude"选项：

**Include（包含）** - 推荐选择：

- 只有列出的IP可以访问
- 这是最常用的安全设置

**Exclude（排除）** - 较少使用：

- 除了列出的IP，其他都可以访问
- 用于特殊场景

**推荐设置：** 选择"Include"

**示例场景：**

- 家用网络：您的宽带公网IP
- 公司网络：公司出口公网IP
- VPS/服务器：服务器的公网IP

### 2.5 设置令牌有效期

- **Start date**（开始日期）: 立即生效
- **End date**（结束日期）: 选择合适过期时间（建议1年）

### 2.6 创建并保存令牌

1. 点击"Continue to summary"（继续到摘要）
2. 检查权限设置
3. 点击"Create Token"（创建令牌）
4. **重要**: 立即复制显示的令牌（只显示一次）

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

### 令牌安全

- ✅ 使用自定义令牌而非全局API密钥
- ✅ 设置IP限制（如果可能）
- ✅ 定期轮换令牌
- ✅ 监控令牌使用情况
- ❌ 不要在代码中硬编码令牌
- ❌ 不要将令牌提交到版本控制

### 权限最小化

- 只授予必要的权限
- 定期审计令牌权限
- 删除不再使用的令牌

## 🛠️ 故障排除

### 常见错误

#### 1. "Invalid API Token"

**原因**: 令牌格式错误或已过期
**解决**:

- 检查令牌是否正确复制
- 确认令牌未过期
- 重新创建令牌

#### 2. "Permission denied"

**原因**: 令牌权限不足
**解决**:

- 确认令牌包含"Cloudflare Tunnel - Edit"权限
- 检查账户资源访问权限

#### 3. "Account not found"

**原因**: 账户ID错误
**解决**:

- 重新获取账户ID
- 确认账户ID格式正确

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

1. 令牌权限是否正确
2. 账户ID是否准确
3. 网络连接是否正常
4. Cloudflare账户状态是否正常

## 🇨🇳 中文界面说明

Cloudflare控制面板支持中文界面，您可以在右上角选择语言为中文，便于操作。
