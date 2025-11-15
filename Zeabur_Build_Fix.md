# Zeabur Docker构建错误修复指南

## 🚨 当前错误

```
Build Failed. Reason: build image: create context filesystem: stat /src: not a directory
```

## 🔍 问题分析

这是**构建上下文路径**配置错误，Zeabur在寻找错误的源路径。

## 🔧 解决方案

### 方案1: 检查Zeabur项目设置

1. **进入Zeabur项目设置** → **Build Settings**

2. **Dockerfile路径**: 确保设置为 `./Dockerfile` (项目根目录)

3. **Build Command**: 留空 (使用Dockerfile内置构建)

4. **Root Directory**: 设置为 `./` (项目根目录)

### 方案2: 修复Dockerfile路径问题

如果问题持续，创建或检查 `.zeabur` 配置：

```json
{
  "build": {
    "dockerfile": "./Dockerfile",
    "context": "./"
  }
}
```

### 方案3: 使用简单构建命令

在Zeabur中设置：

- **Build Command**: `npm ci && npm run build-prod`
- **Dockerfile Path**: `./Dockerfile`
- **Start Command**: 留空

## 🧪 测试步骤

1. **清理构建缓存**: 在Zeabur中点击"Force Rebuild"

2. **检查日志**: 查看构建日志中的详细错误信息

3. **验证路径**: 确保所有文件路径指向项目根目录

## 📁 重要文件检查清单

- ✅ `Dockerfile` 存在于项目根目录
- ✅ `package.json` 存在于项目根目录
- ✅ `startup.sh` 存在于项目根目录
- ✅ `supervisord.conf` 存在于项目根目录

## 🚀 推荐的Zeabur配置

```
Build Configuration:
- Build Command: [留空]
- Dockerfile Path: ./Dockerfile
- Root Directory: ./

Deploy Configuration:
- Start Command: [留空]
- Use Dockerfile Entrypoint: ✓ 启用
```

## 🔄 完整部署流程

修复构建问题后，完整流程应该是：

1. **构建阶段**: Zeabur使用Dockerfile构建镜像
2. **运行阶段**: 容器启动执行`startup.sh`
3. **进程管理**: `startup.sh`启动`supervisord`
4. **服务启动**: `supervisord`启动nginx和Node.js服务器
