/**
 * 飞书多维表格字段设置脚本
 * 
 * 功能：
 * 1. 测试 API 连接
 * 2. 为订单表创建所有必需字段
 * 3. 创建配置表并添加字段
 * 4. 添加默认配置数据
 * 
 * 使用方法：
 * node setup-feishu-tables.js
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

  async getTables() {
    const response = await this.request('GET', `/bitable/v1/apps/${this.baseToken}/tables`);
    if (response.code === 0) {
      return response.data.items;
    } else {
      throw new Error(`获取表格列表失败: ${response.msg}`);
    }
  }

  async createTable(tableName) {
    const data = { table: { name: tableName } };
    const response = await this.request('POST', `/bitable/v1/apps/${this.baseToken}/tables`, data);
    if (response.code === 0) {
      console.log(`✅ 表格创建成功: ${tableName}`);
      // 飞书 API 返回的数据在 response.data 中，table 信息直接在 data 下
      return {
        table_id: response.data.table_id,
        name: response.data.name || tableName
      };
    } else {
      throw new Error(`创建表格失败: ${response.msg}`);
    }
  }

  async createField(tableId, fieldConfig) {
    const data = {
      field_name: fieldConfig.field_name,
      type: fieldConfig.type,
    };
    if (fieldConfig.property) {
      data.property = fieldConfig.property;
    }

    const response = await this.request('POST', `/bitable/v1/apps/${this.baseToken}/tables/${tableId}/fields`, data);
    
    if (response.code === 0) {
      console.log(`  ✅ 字段创建成功: ${fieldConfig.field_name}`);
      return response.data.field;
    } else {
      // 如果字段已存在，不抛出错误
      if (response.msg && (response.msg.includes('already exists') || response.msg.includes('FieldNameDuplicated'))) {
        console.warn(`  ⚠️  字段已存在: ${fieldConfig.field_name}`);
        return null;
      }
      throw new Error(`创建字段失败 ${fieldConfig.field_name}: ${response.msg}`);
    }
  }

  async createRecord(tableId, fields) {
    const data = { fields };
    const response = await this.request('POST', `/bitable/v1/apps/${this.baseToken}/tables/${tableId}/records`, data);
    if (response.code === 0) {
      console.log(`  ✅ 记录创建成功`);
      return response.data.record;
    } else {
      throw new Error(`创建记录失败: ${response.msg}`);
    }
  }
}

// 订单表字段定义
const ORDER_TABLE_FIELDS = [
  { field_name: '日期', type: 5 },                           // 日期类型
  { field_name: '单号', type: 1001 },                       // 文本
  { field_name: '货号', type: 1001 },                       // 文本
  { field_name: '名称', type: 1001 },                       // 文本
  { field_name: '数量', type: 2, property: { formatter: '0' } },  // 数字
  { field_name: '成本', type: 1003 },                       // 货币（先不设置属性）
  { field_name: '单价', type: 1003 },                       // 货币
  { field_name: '单价（卢布）', type: 1003 },              // 货币
  { field_name: '佣金', type: 1003 },                       // 货币
  { field_name: '运费', type: 1003 },                       // 货币
  { field_name: '重量', type: 2, property: { formatter: '0.000' } },  // 数字
  { 
    field_name: '运输方式', 
    type: 3,  // 单选
    property: {
      options: [
        { name: '空运', color: 0 },
        { name: '陆空联运', color: 1 },
        { name: '陆运', color: 2 }
      ]
    }
  },
  { field_name: '尾程', type: 1003 },                       // 货币
  { field_name: '税', type: 1003 },                          // 货币
  { field_name: '利润', type: 1003 },                       // 货币
  { 
    field_name: '状态', 
    type: 3,  // 单选
    property: {
      options: [
        { name: '待处理', color: 0 },
        { name: '采购中', color: 1 },
        { name: '已发货', color: 2 },
        { name: '已完成', color: 3 },
        { name: '取消', color: 4 }
      ]
    }
  },
  { field_name: '图片', type: 17 },                          // 附件
  { field_name: '采购平台', type: 1001 },                   // 文本
  { field_name: '采购链接', type: 15 },                    // 超链接
  { field_name: '备注', type: 1 },                         // 多行文本
  { field_name: '采购备注', type: 1 },                     // 多行文本
];

// 配置表字段定义
const CONFIG_TABLE_FIELDS = [
  { field_name: '卢布汇率', type: 2, property: { formatter: '0.00' } },  // 数字
  { field_name: '更新时间', type: 5 },                                 // 日期时间
];

// 主函数
async function main() {
  console.log('🚀 开始设置飞书多维表格...\n');

  // 创建 API 实例
  const api = new FeishuAPI(FEISHU_CONFIG);

  try {
    // 1. 测试 API 连接
    console.log('1️⃣  测试 API 连接...');
    await api.getAccessToken();
    console.log('  ✅ API 连接成功\n');

    // 2. 获取现有表格
    console.log('2️⃣  获取现有表格...');
    const tables = await api.getTables();
    console.log(`  ✅ 找到 ${tables.length} 个表格`);
    tables.forEach(table => {
      console.log(`     - ${table.name} (ID: ${table.table_id})`);
    });
    console.log();

    // 3. 查找或创建订单表
    let orderTable = tables.find(t => t.name === '订单表');
    if (!orderTable) {
      console.log('3️⃣  创建订单表...');
      orderTable = await api.createTable('订单表');
    } else {
      console.log(`3️⃣  找到订单表 (ID: ${orderTable.table_id})`);
    }
    console.log();

    // 4. 为订单表创建字段
    console.log('4️⃣  为订单表创建字段...');
    for (const field of ORDER_TABLE_FIELDS) {
      await api.createField(orderTable.table_id, field);
      await new Promise(resolve => setTimeout(resolve, 200));  // 避免限流
    }
    console.log('  ✅ 订单表字段创建完成\n');

    // 5. 查找或创建配置表
    let configTable = tables.find(t => t.name === '配置表');
    if (!configTable) {
      console.log('5️⃣  创建配置表...');
      configTable = await api.createTable('配置表');
    } else {
      console.log(`5️⃣  找到配置表 (ID: ${configTable.table_id})`);
    }
    console.log();

    // 6. 为配置表创建字段
    console.log('6️⃣  为配置表创建字段...');
    for (const field of CONFIG_TABLE_FIELDS) {
      await api.createField(configTable.table_id, field);
      await new Promise(resolve => setTimeout(resolve, 200));  // 避免限流
    }
    console.log('  ✅ 配置表字段创建完成\n');

    // 7. 添加默认配置数据
    console.log('7️⃣  添加默认配置数据...');
    try {
      await api.createRecord(configTable.table_id, {
        '卢布汇率': 89.12,
        '更新时间': new Date().toISOString(),
      });
    } catch (error) {
      console.warn('  ⚠️  默认配置可能已存在，跳过');
    }
    console.log();

    // 8. 输出配置信息
    console.log('📋  配置信息:');
    console.log(`  base_token: ${FEISHU_CONFIG.baseToken}`);
    console.log(`  订单表 table_id: ${orderTable.table_id}`);
    console.log(`  配置表 table_id: ${configTable.table_id}`);
    console.log();

    // 9. 更新 config.js
    console.log('💾  请手动更新 config.js 中的 tableId 和 configTableId:');
    console.log(`  tableId: '${orderTable.table_id}'`);
    console.log(`  configTableId: '${configTable.table_id}'`);
    console.log();

    console.log('✅ 设置完成！');
    console.log('\n📝  下一步：');
    console.log('  1. 更新 src/js/config.js 中的 tableId 和 configTableId');
    console.log('  2. 运行本地测试：cd src && live-server --entry-file=sidebar.html');
    console.log('  3. 部署到飞书多维表格侧边栏');

  } catch (error) {
    console.error('❌ 设置失败:', error.message);
    process.exit(1);
  }
}

// 执行主函数
main().catch(error => {
  console.error('未处理的错误:', error);
  process.exit(1);
});
