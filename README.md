# 飞书订单管理系统

基于飞书多维表格的订单管理系统，自动计算利润，提升电商团队效率。

---

## 功能特性 ✨

- 📋 **订单管理**：创建、查看、编辑、删除订单
- 💰 **自动计算利润**：根据飞书文档定义的算法自动计算
  - 税 = 单价 × 3%
  - 尾程 = MAX(MIN(单价（卢布）× 2%, 200), 15) ÷ 11.89
  - 运费 = 根据运输方式/重量/单价（卢布）动态计算（15条规则）
  - 利润 = 单价 - 成本 - 佣金 - 运费 - 税 - 尾程
- 🔍 **实时计算**：输入单价/重量/运输方式时实时重新计算
- 📊 **订单列表**：可排序、可筛选、分页展示
- 📤 **数据导出**：导出为 CSV
- ⚙️ **配置管理**：设置卢布汇率

---

## 技术栈 🛠️

- **前端**：原生 HTML + CSS + JavaScript（无构建工具）
- **CSS 框架**：Tailwind CSS (CDN)
- **HTTP 库**：Axios (CDN)
- **表格组件**：Tabulator (CDN)
- **后端**：飞书多维表格 API（无独立后端）
- **认证**：OAuth 2.0（飞书开放平台）

---

## 项目结构 📁

```
feishu-order-system/
├── README.md                           # 本文件
├── PRD-飞书订单管理系统.md             # 产品需求文档
├── 架构设计-飞书订单管理系统.md        # 系统架构设计
├── src/
│   ├── sidebar.html                    # 主入口（侧边栏）
│   ├── css/
│   │   └── style.css                  # 自定义样式（可选）
│   ├── js/
│   │   ├── app.js                     # 主应用逻辑
│   │   ├── api.js                     # 飞书 API 封装
│   │   ├── calculator.js              # 利润计算器（核心）
│   │   └── components/
│   │       ├── OrderList.js          # 订单列表组件
│   │       ├── OrderForm.js         # 订单表单组件
│   │       ├── OrderDetail.js        # 订单详情组件
│   │       └── ConfigPanel.js        # 配置面板组件
│   └── utils/
│       ├── validator.js          # 表单验证
│       └── formatter.js          # 数据格式化
├── test/
│   └── calculator.test.js             # 利润计算单元测试
└── docs/
    ├── API参考.md                     # 飞书 API 使用说明
    └── 部署指南.md                   # 如何部署到飞书
```

---

## 快速开始 🚀

### 1. 环境准备

- Node.js 已安装（用于本地测试）
- 飞书账号
- 飞书开放平台应用（已创建）

### 2. 克隆项目

```bash
git clone <repo-url>
cd feishu-order-system
```

### 3. 配置飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 创建企业自建应用
3. 启用权限：
   - `bitable:app:readonly`
   - `bitable:app:readwrite`
   - `drive:drive:readonly`
4. 获取 `App ID` 和 `App Secret`

### 4. 创建多维表格

1. 在飞书中创建新的多维表格
2. 创建以下字段（与 PRD 文档一致）：
   - 日期（日期类型）
   - 单号（文本）
   - 货号（文本）
   - 名称（文本）
   - 数量（数字）
   - 成本（货币）
   - 单价（货币）
   - 单价（卢布）（货币）
   - 佣金（货币）
   - 运费（货币）
   - 重量（数字）
   - 运输方式（单选：空运/陆空联运/陆运）
   - 尾程（货币）
   - 税（货币）
   - 利润（货币）
   - 状态（单选：待处理/采购中/已发货/已完成/取消）
   - 图片（附件）
   - 采购平台（文本）
   - 采购链接（文本）
   - 备注（文本）
   - 采购备注（文本）
3. 再创建一个配置表，包含：
   - 卢布汇率（数字）
   - 更新时间（日期时间）
4. 获取 `base_token`（URL 中的字符串）
5. 获取 `table_id`（订单表和配置表各一个）

### 5. 配置应用

**⚠️ 重要：敏感配置不提交到 Git**

1. **创建配置文件**：
   ```bash
   cd src/js
   cp config.template.js config.js
   ```

2. **编辑 `config.js`**，填写真实配置：
   ```javascript
   const FEISHU_CONFIG = {
     appId: 'cli_xxxxxxxxxxxx',           // 替换为真实的 App ID
     appSecret: 'xxxxxxxxxxxxxxxx',        // 替换为真实的 App Secret
     baseToken: 'D2RybBryyaB27QsYp7pcj5xGnfA',   // 替换为真实的 base_token
     tableId: 'tblxxxxxxxxxx',            // 替换为订单表的 table_id
     configTableId: 'tblxxxxxxxxxx',      // 替换为配置表的 table_id
     apiEndpoint: 'https://open.feishu.cn/open-apis'
   };
   ```

3. **确认 `.gitignore` 已包含 `config.js`**（已配置，防止误提交）

### 6. 本地测试

```bash
# 安装 live-server（轻量 HTTP 服务器）
npm install -g live-server

# 启动服务器
cd src
live-server --entry-file=sidebar.html
```

浏览器访问 `http://localhost:8080`

### 7. 部署到飞书

参考 `docs/部署指南.md`

---

## 测试 ✅

运行单元测试：

```bash
cd test
node calculator.test.js
```

预期输出：

```
📝 测试套件: 计算税 (calculateTax)

✅ 通过: 单价 100 元，税 = 100 × 3% = 3.00
✅ 通过: 单价 50.5 元，税 = 50.5 × 3% = 1.52
✅ 通过: 单价 0 元，税 = 0
✅ 通过: 单价为 null，税 = 0

📝 测试套件: 计算尾程 (calculateLastMile)
✅ 通过: 单价（卢布）8912，尾程 ≈ 14.99
✅ 通过: 单价（卢布）1000，尾程 ≈ 1.68
✅ 通过: 单价（卢布）100，尾程 ≈ 1.26 (触发下限 15)
✅ 通过: 单价（卢布）15000，尾程 ≈ 16.82 (触发上限 200)

...

🎉 所有测试通过！
```

---

## 核心算法说明 💻

### 利润计算公式

```
利润 = 单价 - 成本 - 佣金 - 运费 - 税 - 尾程
```

### 运费计算规则（15 条）

运费根据以下三个条件动态计算：

| 条件 | 说明 |
|------|------|
| **运输方式** | 空运 / 陆空联运 / 陆运 |
| **重量** | 0.001-30 kg（分多段） |
| **单价（卢布）** | 1-1500 / 1500-7000 / 7000-250000 |

详细规则见 `src/js/calculator.js` 中的 `shippingRules` 数组。

---

## 常见问题 ❓

### Q1: 为什么利润计算不准确？

**A**: 检查以下项：
1. 汇率是否正确（配置面板中查看）
2. 重量是否填写正确
3. 运输方式是否选择正确
4. 运行单元测试验证计算器：`node test/calculator.test.js`

### Q2: 如何批量导入订单？

**A**: 当前版本（V1.0）暂不支持，将在 V2.0 中支持。

### Q3: 飞书 API 限流怎么办？

**A**: 代码已做处理：
- 使用批量 API（如 `batch_create`）
- 单条操作添加延迟（`await sleep(100)`）

---

## 后续迭代方向 🚀

### V2.0（P1 功能）
- [ ] 批量导入（Excel）
- [ ] 高级筛选（按日期范围、金额范围）
- [ ] 订单状态流转
- [ ] 数据导出（Excel/PDF）

### V3.0（P2 功能）
- [ ] 数据报表（利润分析图表）
- [ ] 权限管理（角色区分）
- [ ] 消息通知（飞书机器人）
- [ ] 采购链接一键跳转

---

## 贡献指南 🤝

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 开源协议 📃

MIT License

---

## 联系方式 📧

- 作者：齐活林（Qi）· 交付总监
- 团队：软件开发团队
- 邮箱：<PRESIDIO_ANONYMIZED_EMAIL>

---

**⚡ 快速链接**
- [产品需求文档（PRD）](./PRD-飞书订单管理系统.md)
- [系统架构设计](./架构设计-飞书订单管理系统.md)
- [部署指南](./docs/部署指南.md)
