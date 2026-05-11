/**
 * Vercel Serverless Function - 飞书 API 代理
 * 所有飞书 API 调用都通过这里，保护 App Secret
 */

import axios from 'axios';

// 获取 tenant_access_token
async function getAccessToken() {
  // 从环境变量读取配置
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const apiEndpoint = process.env.FEISHU_API_ENDPOINT || 'https://open.feishu.cn/open-apis';

  const url = `${apiEndpoint}/auth/v3/tenant_access_token/internal`;
  const data = {
    app_id: appId,
    app_secret: appSecret,
  };

  try {
    const response = await axios.post(url, data);
    if (response.data.code === 0) {
      return response.data.tenant_access_token;
    } else {
      throw new Error(`获取 access_token 失败: ${response.data.msg}`);
    }
  } catch (error) {
    console.error('获取 access_token 失败:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 获取请求体
    const { method, endpoint, data, params } = req.body;

    if (!method || !endpoint) {
      return res.status(400).json({ error: '缺少必要参数: method, endpoint' });
    }

    // 获取 access_token
    const token = await getAccessToken();

    // 构建飞书 API URL
    const apiEndpoint = process.env.FEISHU_API_ENDPOINT || 'https://open.feishu.cn/open-apis';
    const url = `${apiEndpoint}${endpoint}`;

    // 发送请求到飞书 API
    const response = await axios({
      method: method,
      url: url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      params: params || {},
      data: data || {},
    });

    // 返回飞书 API 的响应
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('代理请求失败:', error);
    
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    } else {
      return res.status(500).json({ error: error.message });
    }
  }
}
