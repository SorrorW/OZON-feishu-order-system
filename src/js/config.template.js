/**
 * 配置文件模板
 * 
 * 使用说明：
 * 1. 复制本文件为 config.js：cp config.template.js config.js
 * 2. 填写真实的配置值
 * 3. config.js 已被添加到 .gitignore，不会提交到 Git
 */

const FEISHU_CONFIG = {
  // 飞书应用凭证（从飞书开放平台获取）
  appId: 'YOUR_APP_ID_HERE',           // 替换为真实的 App ID
  appSecret: 'YOUR_APP_SECRET_HERE',   // 替换为真实的 App Secret
  
  // 多维表格信息（从 URL 和多维表格中获取）
  baseToken: 'YOUR_BASE_TOKEN_HERE',   // 替换为真实的 base_token
  tableId: 'YOUR_ORDER_TABLE_ID',      // 替换为订单表的 table_id
  configTableId: 'YOUR_CONFIG_TABLE_ID', // 替换为配置表的 table_id
  
  // API 端点（通常不需要修改）
  apiEndpoint: 'https://open.feishu.cn/open-apis'
};

// 导出配置（兼容浏览器环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FEISHU_CONFIG;
}
