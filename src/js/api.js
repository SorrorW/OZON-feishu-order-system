/**
 * FeishuAPI - 飞书多维表格 API 封装（通过后端代理）
 * 
 * 封装所有飞书 API 调用，包括：
 * - 订单的 CRUD 操作
 * - 配置读取
 * - 图片上传
 * 
 * 注意：所有 API 调用都通过后端代理 /api/feishu-proxy，
 * 避免在前端暴露 App Secret。
 */

class FeishuAPI {
  /**
   * 构造函数
   */
  constructor() {
    // 配置将从 /api/config 加载
    this.baseToken = '';
    this.tableId = '';          // 订单表 ID
    this.configTableId = '';     // 配置表 ID
    this.apiEndpoint = '';       // API 端点（从后端获取）
    
    this.initialized = false;
  }

  /**
   * 初始化配置（从后端加载）
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      const response = await axios.get('/api/config');
      const config = response.data;
      
      this.baseToken = config.baseToken || '';
      this.tableId = config.tableId || '';
      this.configTableId = config.configTableId || '';
      this.apiEndpoint = config.apiEndpoint || 'https://open.feishu.cn/open-apis';
      
      this.initialized = true;
      
      console.log('[FeishuAPI] 配置加载成功');
    } catch (error) {
      console.error('[FeishuAPI] 配置加载失败:', error);
      throw new Error('无法加载配置，请确保后端服务正常运行');
    }
  }

  /**
   * 通用请求方法（通过后端代理）
   * @param {string} method - HTTP 方法
   * @param {string} endpoint - API 端点
   * @param {Object} data - 请求体数据
   * @param {Object} params - URL 参数
   * @returns {Promise<Object>} 响应数据
   */
  async request(method, endpoint, data = null, params = {}) {
    // 确保配置已加载
    if (!this.initialized) {
      await this.init();
    }

    try {
      const response = await axios.post('/api/feishu-proxy', {
        method: method,
        endpoint: endpoint,
        data: data,
        params: params,
      });

      return response.data;
    } catch (error) {
      console.error(`[FeishuAPI] ${method} ${endpoint} 失败:`, error);
      if (error.response) {
        console.error('响应数据:', error.response.data);
      }
      throw error;
    }
  }

  // ==================== 表格和字段操作 ====================

  /**
   * 获取多维表格中的所有表格
   * @returns {Promise<Array>} 表格列表
   */
  async getTables() {
    const response = await this.request('GET', `/bitable/v1/apps/${this.baseToken}/tables`);
    if (response.code === 0) {
      return response.data.items;
    } else {
      throw new Error(`获取表格列表失败: ${response.msg}`);
    }
  }

  /**
   * 获取表格的所有字段
   * @param {string} tableId - 表格 ID
   * @returns {Promise<Array>} 字段列表
   */
  async getFields(tableId) {
    const response = await this.request('GET', `/bitable/v1/apps/${this.baseToken}/tables/${tableId}/fields`);
    if (response.code === 0) {
      return response.data.items;
    } else {
      throw new Error(`获取字段列表失败: ${response.msg}`);
    }
  }

  /**
   * 创建字段
   * @param {string} tableId - 表格 ID
   * @param {Object} fieldConfig - 字段配置
   * @param {string} fieldConfig.field_name - 字段名称
   * @param {number} fieldConfig.type - 字段类型
   * @param {Object} fieldConfig.property - 字段属性（可选）
   * @returns {Promise<Object>} 创建的字段信息
   */
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
      console.log(`[FeishuAPI] 字段创建成功: ${fieldConfig.field_name}`);
      return response.data.field;
    } else {
      // 如果字段已存在，不抛出错误
      if (response.msg && response.msg.includes('already exists')) {
        console.warn(`[FeishuAPI] 字段已存在: ${fieldConfig.field_name}`);
        return null;
      }
      throw new Error(`创建字段失败 ${fieldConfig.field_name}: ${response.msg}`);
    }
  }

  /**
   * 批量创建字段
   * @param {string} tableId - 表格 ID
   * @param {Array<Object>} fields - 字段配置数组
   * @returns {Promise<Array>} 创建的字段列表
   */
  async batchCreateFields(tableId, fields) {
    const createdFields = [];
    for (const field of fields) {
      try {
        const created = await this.createField(tableId, field);
        if (created) {
          createdFields.push(created);
        }
        // 避免限流，添加延迟
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`[FeishuAPI] 创建字段 ${field.field_name} 失败:`, error.message);
        // 继续执行其他字段
      }
    }
    return createdFields;
  }

  // ==================== 订单 CRUD 操作 ====================

  /**
   * 获取订单列表
   * @param {Object} options - 查询选项
   * @param {number} options.pageSize - 每页数量（默认 100）
   * @param {string} options.pageToken - 分页令牌
   * @param {string} options.filter - 筛选条件（Formula 语法）
   * @returns {Promise<Array>} 订单记录数组
   */
  async getOrders(options = {}) {
    const { pageSize = 100, pageToken = '', filter = '' } = options;
    const params = { page_size: pageSize };
    if (pageToken) params.page_token = pageToken;
    if (filter) params.filter = filter;

    const response = await this.request('GET', `/bitable/v1/apps/${this.baseToken}/tables/${this.tableId}/records`, null, params);
    
    if (response.code === 0) {
      return {
        records: response.data.items.map(item => this.parseOrderRecord(item)),
        hasMore: response.data.has_more,
        pageToken: response.data.page_token,
      };
    } else {
      throw new Error(`获取订单列表失败: ${response.msg}`);
    }
  }

  /**
   * 获取单个订单
   * @param {string} recordId - 记录 ID
   * @returns {Promise<Object>} 订单对象
   */
  async getOrder(recordId) {
    const response = await this.request('GET', `/bitable/v1/apps/${this.baseToken}/tables/${this.tableId}/records/${recordId}`);
    
    if (response.code === 0) {
      return this.parseOrderRecord(response.data.record);
    } else {
      throw new Error(`获取订单失败: ${response.msg}`);
    }
  }

  /**
   * 创建订单
   * @param {Object} order - 订单数据
   * @returns {Promise<string>} 新创建的记录 ID
   */
  async createOrder(order) {
    const fields = this.formatOrderForFeishu(order);
    
    const data = { fields };
    const response = await this.request('POST', `/bitable/v1/apps/${this.baseToken}/tables/${this.tableId}/records`, data);
    
    if (response.code === 0) {
      return response.data.record_id;
    } else {
      throw new Error(`创建订单失败: ${response.msg}`);
    }
  }

  /**
   * 更新订单
   * @param {string} recordId - 记录 ID
   * @param {Object} order - 要更新的订单数据
   * @returns {Promise<void>}
   */
  async updateOrder(recordId, order) {
    const fields = this.formatOrderForFeishu(order);
    
    const data = { fields };
    const response = await this.request('PUT', `/bitable/v1/apps/${this.baseToken}/tables/${this.tableId}/records/${recordId}`, data);
    
    if (response.code !== 0) {
      throw new Error(`更新订单失败: ${response.msg}`);
    }
  }

  /**
   * 删除订单
   * @param {string} recordId - 记录 ID
   * @returns {Promise<void>}
   */
  async deleteOrder(recordId) {
    const response = await this.request('DELETE', `/bitable/v1/apps/${this.baseToken}/tables/${this.tableId}/records/${recordId}`);
    
    if (response.code !== 0) {
      throw new Error(`删除订单失败: ${response.msg}`);
    }
  }

  /**
   * 批量创建订单
   * @param {Array<Object>} orders - 订单数组
   * @returns {Promise<Array<string>>} 创建的记录 ID 数组
   */
  async batchCreateOrders(orders) {
    const records = orders.map(order => ({
      fields: this.formatOrderForFeishu(order),
    }));
    
    const data = { records };
    const response = await this.request('POST', `/bitable/v1/apps/${this.baseToken}/tables/${this.tableId}/records/batch_create`, data);
    
    if (response.code === 0) {
      return response.data.records.map(r => r.record_id);
    } else {
      throw new Error(`批量创建订单失败: ${response.msg}`);
    }
  }

  // ==================== 配置操作 ====================

  /**
   * 获取配置
   * @returns {Promise<Object>} 配置对象（含汇率）
   */
  async getConfig() {
    const response = await this.request('GET', `/bitable/v1/apps/${this.baseToken}/tables/${this.configTableId}/records`, null, { page_size: 1 });
    
    if (response.code === 0 && response.data.items.length > 0) {
      const record = response.data.items[0];
      return {
        recordId: record.record_id,
        rubleExchangeRate: record.fields['卢布汇率'] || 89.12,
        updatedAt: record.fields['更新时间'] || new Date().toISOString(),
      };
    } else {
      // 如果配置不存在，创建默认配置
      return this.createDefaultConfig();
    }
  }

  /**
   * 更新配置（汇率）
   * @param {number} exchangeRate - 新汇率
   * @param {string} recordId - 配置记录 ID
   * @returns {Promise<void>}
   */
  async updateConfig(exchangeRate, recordId) {
    const data = {
      fields: {
        '卢布汇率': exchangeRate,
        '更新时间': new Date().toISOString(),
      },
    };
    
    const response = await this.request('PUT', `/bitable/v1/apps/${this.baseToken}/tables/${this.configTableId}/records/${recordId}`, data);
    
    if (response.code !== 0) {
      throw new Error(`更新配置失败: ${response.msg}`);
    }
  }

  /**
   * 创建默认配置
   * @returns {Promise<Object>} 默认配置
   */
  async createDefaultConfig() {
    const data = {
      fields: {
        '卢布汇率': 89.12,
        '更新时间': new Date().toISOString(),
      },
    };
    
    const response = await this.request('POST', `/bitable/v1/apps/${this.baseToken}/tables/${this.configTableId}/records`, data);
    
    if (response.code === 0) {
      return {
        recordId: response.data.record_id,
        rubleExchangeRate: 89.12,
        updatedAt: new Date().toISOString(),
      };
    } else {
      throw new Error(`创建默认配置失败: ${response.msg}`);
    }
  }

  // ==================== 数据格式转换 ====================

  /**
   * 将飞书记录转换为 Order 对象
   * @param {Object} record - 飞书记录
   * @returns {Object} Order 对象
   */
  parseOrderRecord(record) {
    const fields = record.fields;
    return {
      recordId: record.record_id,
      日期: fields['日期'] || '',
      备注: fields['备注'] || '',
      单号: fields['单号'] || '',
      图片: fields['图片'] || [],
      货号: fields['货号'] || '',
      名称: fields['名称'] || '',
      数量: fields['数量'] || 0,
      采购平台: fields['采购平台'] || '',
      采购备注: fields['采购备注'] || '',
      采购链接: fields['采购链接'] || '',
      成本: fields['成本'] || 0,
      单价: fields['单价'] || 0,
      '单价（卢布）': fields['单价（卢布）'] || 0,
      佣金: fields['佣金'] || 0,
      运费: fields['运费'] || 0,
      重量: fields['重量'] || 0,
      运输方式: fields['运输方式'] || '陆运',
      尾程: fields['尾程'] || 0,
      税: fields['税'] || 0,
      利润: fields['利润'] || 0,
      状态: fields['状态'] || '待处理',
    };
  }

  /**
   * 将 Order 对象转换为飞书字段格式
   * @param {Object} order - Order 对象
   * @returns {Object} 飞书字段对象
   */
  formatOrderForFeishu(order) {
    const fields = {};
    
    if (order['日期']) fields['日期'] = order['日期'];
    if (order['备注'] !== undefined) fields['备注'] = order['备注'];
    if (order['单号']) fields['单号'] = order['单号'];
    if (order['货号']) fields['货号'] = order['货号'];
    if (order['名称']) fields['名称'] = order['名称'];
    if (order['数量'] !== undefined) fields['数量'] = order['数量'];
    if (order['采购平台']) fields['采购平台'] = order['采购平台'];
    if (order['采购备注'] !== undefined) fields['采购备注'] = order['采购备注'];
    if (order['采购链接'] !== undefined) fields['采购链接'] = order['采购链接'];
    if (order['成本'] !== undefined) fields['成本'] = order['成本'];
    if (order['单价'] !== undefined) fields['单价'] = order['单价'];
    if (order['单价（卢布）'] !== undefined) fields['单价（卢布）'] = order['单价（卢布）'];
    if (order['佣金'] !== undefined) fields['佣金'] = order['佣金'];
    if (order['运费'] !== undefined) fields['运费'] = order['运费'];
    if (order['重量'] !== undefined) fields['重量'] = order['重量'];
    if (order['运输方式']) fields['运输方式'] = order['运输方式'];
    if (order['尾程'] !== undefined) fields['尾程'] = order['尾程'];
    if (order['税'] !== undefined) fields['税'] = order['税'];
    if (order['利润'] !== undefined) fields['利润'] = order['利润'];
    if (order['状态']) fields['状态'] = order['状态'];
    
    // 图片字段需要特殊处理（附件类型）
    if (order['图片'] && order['图片'].length > 0) {
      fields['图片'] = order['图片'];
    }
    
    return fields;
  }

  // ==================== 工具方法 ====================

  /**
   * 设置表格 ID（订单表）
   * @param {string} tableId - 表格 ID
   */
  setTableId(tableId) {
    this.tableId = tableId;
  }

  /**
   * 设置配置表 ID
   * @param {string} configTableId - 配置表格 ID
   */
  setConfigTableId(configTableId) {
    this.configTableId = configTableId;
  }

  /**
   * 测试 API 连接
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      await this.getConfig();
      return true;
    } catch (error) {
      console.error('[FeishuAPI] 连接测试失败:', error);
      return false;
    }
  }
}

// 导出（兼容浏览器和 Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeishuAPI;
}
