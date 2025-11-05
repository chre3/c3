# 发布到 NPM 指南

## 📋 准备工作

### 1. 清理项目 ✅
- ✅ 已删除无用文件（BUILD.md, USAGE.md）
- ✅ 已更新 .npmignore
- ✅ 已更新 package.json

### 2. 检查 package.json

确保以下信息正确：
- `name`: `c3-sdk` ✅
- `version`: `1.0.0` ✅
- `repository`: 需要更新为实际的 GitHub 仓库地址
- `author`: 建议添加作者信息

### 3. 更新 repository 信息

编辑 `package.json`，将 `your-username` 替换为实际的 GitHub 用户名：

```json
"repository": {
  "type": "git",
  "url": "https://github.com/your-username/c3-sdk.git"
},
"homepage": "https://github.com/your-username/c3-sdk#readme",
"bugs": {
  "url": "https://github.com/your-username/c3-sdk/issues"
}
```

## 🚀 发布步骤

### 1. 登录 npm

```bash
npm login
```

输入你的 npm 账号信息：
- Username
- Password
- Email

### 2. 检查登录状态

```bash
npm whoami
```

### 3. 检查包名是否可用

```bash
npm view c3-sdk
```

如果返回 404，说明包名可用。

### 4. 发布到 npm

```bash
npm publish
```

或者使用 `--access public`（如果包名包含 scope）：

```bash
npm publish --access public
```

## 📦 CDN 链接

发布成功后，可以通过以下 CDN 使用：

### jsDelivr

```html
<!-- 最新版本 -->
<script src="https://cdn.jsdelivr.net/npm/c3-sdk@latest/dist/c3-sdk.umd.js"></script>

<!-- 指定版本 -->
<script src="https://cdn.jsdelivr.net/npm/c3-sdk@1.0.0/dist/c3-sdk.umd.js"></script>
```

### unpkg

```html
<!-- 最新版本 -->
<script src="https://unpkg.com/c3-sdk@latest/dist/c3-sdk.umd.js"></script>

<!-- 指定版本 -->
<script src="https://unpkg.com/c3-sdk@1.0.0/dist/c3-sdk.umd.js"></script>
```

## 🔄 更新版本

发布新版本时：

1. 更新 `package.json` 中的 `version`
2. 运行 `npm run build`
3. 运行 `npm publish`

或者使用 npm version 命令：

```bash
# 补丁版本 (1.0.0 -> 1.0.1)
npm version patch

# 小版本 (1.0.0 -> 1.1.0)
npm version minor

# 大版本 (1.0.0 -> 2.0.0)
npm version major
```

然后发布：

```bash
npm publish
```

## ✅ 验证发布

发布成功后，可以验证：

1. 访问 npm 包页面：https://www.npmjs.com/package/c3-sdk
2. 测试 CDN 链接是否可用
3. 测试安装：`npm install c3-sdk`

## 📝 注意事项

1. **首次发布**：确保包名 `c3-sdk` 在 npm 上可用
2. **版本号**：遵循语义化版本规范（SemVer）
3. **README**：npm 会自动显示 README.md
4. **文件包含**：只有 `files` 字段中的文件会被发布
5. **构建**：`prepublishOnly` 脚本会在发布前自动构建

## 🎯 当前发布配置

已配置的文件：
- ✅ `dist/` - 构建产物
- ✅ `README.md` - 英文文档
- ✅ `README.zh.md` - 中文文档

已排除的文件：
- ✅ `src/` - 源代码
- ✅ `node_modules/` - 依赖
- ✅ `vite.config.js` - 构建配置
- ✅ `.gitignore` - Git 配置

