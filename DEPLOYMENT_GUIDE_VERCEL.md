# Vercel 部署指南 - 飞书订单管理系统

本指南将帮助你将飞书订单管理系统部署到 Vercel，实现安全的网页应用访问。

---

## 📋 目录

1. [准备工作](#准备工作)
2. [上传代码到 GitHub](#上传代码到-github)
3. [连接 Vercel 部署](#连接-vercel-部署)
4. [配置环境变量](#配置环境变量)
5. [配置飞书网页应用](#配置飞书网页应用)
6. [测试和验证](#测试和验证)
7. [常见问题](#常见问题)

---

## 准备工作

### 必需账号

1. **GitHub 账号**：用于托管代码
   - 访问：https://github.com/signup
   - 注册并验证邮箱

2. **Vercel 账号**：用于部署应用
   - 访问：https://vercel.com/signup
   - 使用 GitHub 账号登录（推荐）

### 检查项目文件

确保你的项目目录 (`G:\WorkBuddy file\2026-05-10-task-1`) 包含以下文件：

```
├── api/
│   ├── config.js          # 后端配置接口
│   ├── feishu-proxy.js   # 飞书 API 代理
│   └── package.json      # 后端依赖
├── dist/                  # 前端静态文件
│   ├── sidebar.html
│   ├── js/
│   │   ├── api.js        # 已修改为调用后端代理
│   │   ├── app.js
│   │   └── ...
│   └── ...
├── vercel.json            # Vercel 配置文件
└── .gitignore            # Git 排除规则
```

**关键文件说明**：
- `api/` 目录：Vercel Serverless Functions，保护 App Secret
- `dist/` 目录：前端代码，通过后端代理调用飞书 API
- `vercel.json`：Vercel 部署配置

---

## 上传代码到 GitHub

### 步骤1：创建 GitHub 仓库

1. **访问 GitHub**：https://github.com/
2. **点击右上角 "+" → "New repository"**
3. **填写仓库信息**：
   - Repository name: `feishu-order-system`（可自定义）
   - Description: `飞书订单管理系统`
   - 选择 **"Public"**（Vercel 免费版需要公开仓库）
   - ✅ 勾选 **"Add a README file"**
4. **点击 "Create repository"**

### 步骤2：上传代码

**方法A：使用 Git 命令行**（推荐）

```bash
# 进入项目目录
cd "G:\WorkBuddy file\2026-05-10-task-1"

# 初始化 Git
git init

# 添加所有文件（注意：dist/ 被 .gitignore 排除）
git add .

# 提交
git commit -m "Initial commit: 飞书订单管理系统（适配 Vercel 部署）"

# 连接远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/feishu-order-system.git

# 推送到 GitHub
git push -u origin main
```

**如果遇到分支名称错误**（例如 `main` vs `master`）：

```bash
# 重命名分支
git branch -M main
git push -u origin main
```

**方法B：直接上传 ZIP**（简单但不够灵活）

1. 在 GitHub 仓库页面，点击 **"Add file" → "Upload files"**
2. 上传以下文件和目录（**除了 `dist/` 和 `node_modules/`**）：
   - `api/` 目录
   - `src/` 目录
   - `vercel.json`
   - `.gitignore`
   - `README.md`
3. 点击 **"Commit changes"**

---

## 连接 Vercel 部署

### 步骤1：登录 Vercel

1. **访问 Vercel**：https://vercel.com/
2. **点击 "Log In"**
3. **选择 "Continue with GitHub"**
4. **授权 Vercel 访问你的 GitHub 账号**

### 步骤2：导入 GitHub 仓库

1. **在 Vercel 仪表盘，点击 "Add New..." → "Project"**
2. **在 "Import Git Repository" 页面，选择你的仓库**：
   - `feishu-order-system`
3. **配置项目**：
   - **Framework Preset**: 选择 **"Other"**（纯静态网站 + Serverless Functions）
   - **Root Directory**: `./`（默认）
   - **Build Command**: **留空**（不需要构建）
   - **Output Directory**: `dist`（前端文件在 dist/ 目录）
   - **Install Command**: `cd api && npm install`（安装后端依赖）
4. **不要点击 "Deploy"**，先配置环境变量（见下一步）

### 步骤3：配置环境变量

在 Vercel 项目配置页面，找到 **"Environment Variables"** 部分，添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `FEISHU_APP_ID` | `cli_aa8a2b3862b8dbed` | 飞书应用 App ID |
| `FEISHU_APP_SECRET` | `046Vs7hIbj5aLLGdLRY5ndAcGyI3gBIk` | 飞书应用 App Secret |
| `FEISHU_BASE_TOKEN` | `Xg16bELkqa2u68s2qsvcay2LnJf` | 多维表格 base_token |
| `FEISHU_TABLE_ID` | `tblRO6MoUQWRh2Br` | 订单表 table_id |
| `FEISHU_CONFIG_TABLE_ID` | `tblKaIV13Ciph2KH` | 配置表 table_id |
| `FEISHU_API_ENDPOINT` | `https://open.feishu.cn/open-apis` | 飞书 API 端点（默认值） |

**添加环境变量的步骤**：
1. 在 "Environment Variables" 部分，点击 **"Add"**
2. 填写 **Name** 和 **Value**
3. 选择环境：**Production**, **Preview**, **Development**（全选）
4. 点击 **"Save"**
5. 重复以上步骤，添加所有 6 个环境变量

### 步骤4：部署

1. **环境变量配置完成后，点击页面底部的 "Deploy" 按钮**
2. **等待部署完成**（通常 1-2 分钟）
3. **部署成功后，Vercel 会提供一个 HTTPS 域名**，例如：
   ```
   https://feishu-order-system.vercel.app
   ```

**记录这个域名，下一步配置飞书网页应用需要用到！**

---

## 配置飞书网页应用

### 步骤1：访问飞书开放平台

1. **打开**：https://open.feishu.cn/
2. **登录你的账号**
3. **进入开发者后台**
4. **找到你的应用**：`订单管理系统`（App ID: `cli_aa8a2b3862b8dbed`）

### 步骤2：配置网页应用

1. **在应用管理页面，找到 "应用能力" 或 "网页应用"**
2. **点击 "配置网页应用" 或类似按钮**
3. **填写配置**：
   - ✅ 勾选 **"桌面端主页"**
   - **桌面端主页**：`https://你的域名.vercel.app/sidebar.html`
     - 例如：`https://feishu-order-system.vercel.app/sidebar.html`
   - ✅ 勾选 **"在飞书内新标签页打开"**（可选，推荐勾选）
4. **点击 "保存"**

### 步骤3：发布应用

1. **在应用管理页面，找到 "版本管理与发布"**
2. **点击 "创建版本"**
3. **填写版本信息**：
   - **版本号**：`1.0.0`
   - **更新说明**：`初始版本，支持订单管理、利润自动计算（部署到 Vercel）`
4. **点击 "提交审核"**
5. **等待审核通过**（通常几分钟到几小时）
6. **审核通过后，点击 "发布"**

---

## 测试和验证

### 步骤1：在飞书工作台打开应用

1. **打开飞书客户端或访问** https://feishu.cn/
2. **进入工作台**
3. **找到你的应用**：`订单管理系统`
4. **点击打开**

### 步骤2：验证功能

检查以下功能是否正常：

- ✅ **页面加载**：侧边栏界面正常显示
- ✅ **读取数据**：订单列表能正常加载
- ✅ **创建订单**：能成功创建新订单
- ✅ **编辑订单**：能修改订单信息
- ✅ **删除订单**：能删除订单
- ✅ **利润计算**：利润、税、尾程等字段能正确计算

### 步骤3：检查浏览器控制台

**按 F12 打开开发者工具，查看 Console 标签页**：

- ✅ 没有红色错误信息
- ✅ 能看到 API 请求成功（例如：`[FeishuAPI] 配置加载成功`）
- ❌ 不应该看到 App Secret 等敏感信息

---

## 常见问题

### 问题1：部署失败，提示 "api/package.json not found"

**原因**：`api/package.json` 文件不存在或路径错误

**解决**：
1. 检查 `api/` 目录是否存在
2. 检查 `api/package.json` 是否存在
3. 重新上传代码到 GitHub

---

### 问题2：部署成功，但访问时显示 "Internal Server Error"

**原因**：后端 Serverless Function 出错

**解决**：
1. 访问 Vercel 项目页面
2. 点击 **"Deployments"**
3. 点击最新部署的 **"Functions"** 标签页
4. 查看错误日志
5. 常见错误：
   - 环境变量未配置或配置错误
   - `axios` 依赖未安装（检查 `api/package.json`）
   - 代码语法错误

---

### 问题3：前端无法加载配置，提示 "无法加载配置"

**原因**：后端 `/api/config` 接口出错

**解决**：
1. 直接访问 `https://你的域名.vercel.app/api/config`
2. 查看返回的 JSON 数据是否正确
3. 如果返回错误，检查 Vercel 环境变量是否配置正确

---

### 问题4：飞书 API 调用失败，提示 "Invalid access token"

**原因**：App ID 或 App Secret 配置错误

**解决**：
1. 检查 Vercel 环境变量 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET`
2. 确认值与 `src/js/config.template.js` 中的默认值一致
3. 重新部署 Vercel 项目

---

### 问题5：CORS 错误

**原因**：前端和后端不在同一个域名下（但实际上 Vercel 会处理这个）

**解决**：
1. 确认前端代码正确调用 `/api/feishu-proxy`
2. 确认后端代理代码没有问题
3. 查看 Vercel 部署日志

---

## 高级配置

### 自定义域名

如果你想使用自己的域名（例如 `order.yourcompany.com`）：

1. **在 Vercel 项目页面，点击 "Settings" → "Domains"**
2. **添加你的域名**
3. **按照提示配置 DNS 解析**
4. **等待 DNS 生效**（通常几分钟到几小时）

### 自动部署

Vercel 支持自动部署：
- 每次推送到 GitHub `main` 分支，Vercel 会自动重新部署
- 你可以在 Vercel 项目设置中配置构建钩子（Build Hooks）

---

## 安全注意事项

### 1. 保护 App Secret

- ✅ App Secret 只存在于 Vercel 环境变量和后端代码中
- ✅ 前端代码不包含 App Secret
- ✅ 即使查看网页源代码，也无法看到 App Secret

### 2. 限制访问

- 飞书网页应用只能在飞书内打开
- 直接访问 `https://你的域名.vercel.app/sidebar.html` 可能无法正常使用（因为需要飞书环境）

### 3. 定期更新依赖

- 定期检查 `api/package.json` 中的依赖版本
- 更新到最新稳定版，修复安全漏洞

---

## 总结

完成以上步骤后，你的飞书订单管理系统就成功部署到 Vercel 了！

**部署流程回顾**：
1. ✅ 修改代码，添加后端代理（已完成）
2. ✅ 上传代码到 GitHub
3. ✅ 连接 Vercel 部署
4. ✅ 配置环境变量
5. ✅ 配置飞书网页应用
6. ✅ 测试并验证

**下一步**：
- 使用系统管理订单
- 根据需要修改功能
- 推送代码更新，Vercel 会自动重新部署

---

**如有问题，请截图错误信息并联系我！** 🚀
