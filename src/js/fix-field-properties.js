/**
 * 修复飞书多维表格字段属性
 * 
 * 功能：更新已创建字段的属性（小数位数、选项等）
 * 
 * 使用方法：
 * node fix-field-properties.js
 */

const axios = require('axios');

// 从 config.js 读取配置
const FEISHU_CONFIG = require('./config.js');

// 飞书 API 封装类
class FeishuAPI {
  constructor(config) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.baseToken = config.baseToken;
    this.apiEndpoint = config.apiEndpoint || 'https://open.feishu.cn/open-apis';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const url = `${this.apiEndpoint}/auth/v3/tenant_access_token/internal`;
    const data = {
      app_id: this.appId,
      app_secret: this.appSecret,
    };

    try {
      const response = await axios.post(url, data);
      if (response.data.code === 0) {
        this.accessToken = response.data.tenant_access_token;
        this.tokenExpiry = Date.now() + (response.data.expire - 300) * 1000;
        return this.accessToken;
      } else {
        throw new Error(`获取 access_token 失败: ${response.data.msg}`);
      }
    } catch (error) {
      console.error('获取 access_token 失败:', error.response?.data || error.message);
      throw error;
    }
  }

  async request(method, endpoint, data = null, params = {}) {
    const token = await this.getAccessToken();
    const url = `${this.apiEndpoint}${endpoint}`;
    
    const config = {
      method: method,
      url: url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      params: params,
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`${method} ${endpoint} 失败:`, error.response?.data || error.message);
      throw error;
    }
  }

  async getFields(tableId) {
    const response = await this.request('GET', `/bitable/v1/apps/${this.baseToken}/tables/${tableId}/fields`);
    if (response.code === 0) {
      return response.data.items;
    } else {
      throw new Error(`获取字段列表失败: ${response.msg}`);
    }
  }

  async updateField(tableId, fieldId, updates) {
    const data = updates;
    const response = await this.request('PUT', `/bitable/v1/apps/${this.baseToken}/tables/${tableId}/fields/${fieldId}`, data);
    
    if (response.code === 0) {
      console.log(`  ✅ 字段更新成功: ${updates.field_name || ''}`);
      return response.data.field;
    } else {
      console.error(`  ❌ 字段更新失败: ${response.msg}`);
      return null;
    }
  }
}

// 正确的字段属性配置
const FIELD_UPDATES = {
  // 订单表字段属性
  '订单表': [
    {
      field_name: '数量',
      type: 2,
      property: { formatter: '0' }  // 整数，无小数
    },
    {
      field_name: '成本',
      type: 1003,
      property: { formatter: 3 }  // 货币，2位小数（formatter: 3 表示 2 位小数）
    },
    {
      field_name: '单价',
      type: 1003,
      property: { formatter: 3 }
    },
    {
      field_name: '单价（卢布）',
      type: 1003,
      property: { formatter: 3 }
    },
    {
      field_name: '佣金',
      type: 1003,
      property: { formatter: 3 }
    },
    {
      field_name: '运费',
      type: 1003,
      property: { formatter: 3 }
    },
    {
      field_name: '重量',
      type: 2,
      property: { formatter: '0.000' }  // 3位小数
    },
    {
      field_name: '尾程',
      type: 1003,
      property: { formatter: 3 }
    },
    {
      field_name: '税',
      type: 1003,
      property: { formatter: 3 }
    },
    {
      field_name: '利润',
      type: 1003,
      property: { formatter: 3 }
    },
    {
      field_name: '运输方式',
      type: 3,
      property: {
        options: [
          { name: '空运', color: 0 },
          { name: '陆空联运', color: 1 },
          { name: '陆运', color: 2 }
        ]
      }
    },
    {
      field_name: '状态',
      type: 3,
      property: {
        options: [
          { name: '待处理', color: 0 },
          { name: '采购中', color: 1 },
          { name: '已发货', color: 2 },
          { name: '已完成', color: 3 },
          { name: '取消', color: 4 }
        ]
      }
    }
  ],
  // 配置表字段属性
  '配置表': [
    {
      field_name: '卢布汇率',
      type: 2,
      property: { formatter: '0.00' }  // 2位小数
    },
    {
      field_name: '更新时间',
      type: 5,
      property: {}  // 日期时间，无需额外属性
    }
  ]
};

// 主函数
async function main() {
  console.log('🔧 开始修复字段属性...\n');

  const api = new FeishuAPI(FEISHU_CONFIG);

  try {
    // 1. 测试 API 连接
    console.log('1️⃣ 测试 API 连接...');
    await api.getAccessToken();
    console.log('  ✅ API 连接成功\n');

    // 2. 获取所有表格
    console.log('2️⃣ 获取表格列表...');
    const tablesResponse = await api.request('GET', `/bitable/v1/apps/${FEISHU_CONFIG.baseToken}/tables`);
    if (tablesResponse.code !== 0) {
      throw new Error(`获取表格列表失败: ${tablesResponse.msg}`);
    }

    const tables = tablesResponse.data.items;
    console.log(`  ✅ 找到 ${tables.length} 个表格\n`);

    // 3. 修复每个表格的字段属性
    for (const tableName of ['订单表', '配置表']) {
      const table = tables.find(t => t.name === tableName);
      if (!table) {
        console.warn(`  ⚠️  未找到表格: ${tableName}，跳过`);
        continue;
      }

      console.log(`3️⃣  修复 ${tableName} 的字段属性...`);
      
      // 获取表格的所有字段
      const fields = await api.getFields(table.table_id);
      console.log(`  找到 ${fields.length} 个字段`);

      // 更新字段属性
      const updates = FIELD_UPDATES[tableName] || [];
      for (const update of updates) {
        const field = fields.find(f => f.field_name === update.field_name);
        if (!field) {
          console.warn(`  ⚠️  未找到字段: ${update.field_name}`);
          continue;
        }

        console.log(`  更新字段: ${update.field_name}`);
        
        // 根据字段类型，只更新必要的属性
        const updateData = {};
        
        // 对于单选字段，更新选项
        if (update.type === 3 && update.property && update.property.options) {
          updateData.property = {
            options: update.property.options
          };
        }
        
        // 对于数字或货币字段，更新格式
        if (update.type === 2 || update.type === 1003) {
          if (!updateData.property) updateData.property = {};
          updateData.property.formatter = update.property.formatter;
        }

        if (Object.keys(updateData).length > 0) {
          await api.updateField(table.table_id, field.field_id, updateData);
          await new Promise(resolve => setTimeout(resolve, 200));  // 避免限流
        }
      }
      
      console.log(`  ✅ ${tableName} 字段属性修复完成\n`);
    }

    console.log('✅ 所有字段属性修复完成！');
    console.log('\n📝 请手动检查飞书多维表格，确认字段属性是否正确：');
    console.log('  - 数字字段的小数位数');
    console.log('  - 货币字段的格式');
    console.log('  - 单选字段的选项');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error('未处理的错误:', error);
  process.exit(1);
});
