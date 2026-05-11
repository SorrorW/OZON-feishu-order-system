/**
 * Vercel Serverless Function - 配置接口
 * 返回非敏感配置信息（不包含 App Secret）
 */

export default function handler(req, res) {
  // 只允许 GET 请求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 返回非敏感配置
  const config = {
    baseToken: process.env.FEISHU_BASE_TOKEN || '',
    tableId: process.env.FEISHU_TABLE_ID || '',
    configTableId: process.env.FEISHU_CONFIG_TABLE_ID || '',
    apiEndpoint: process.env.FEISHU_API_ENDPOINT || 'https://open.feishu.cn/open-apis',
  };

  return res.status(200).json(config);
}
