/**
 * OrderForm - 订单表单组件（新建/编辑）
 */

class OrderForm {
  /**
   * 构造函数
   * @param {HTMLElement} container - 表单容器
   * @param {Object} options - 配置选项
   * @param {Function} options.onSave - 保存回调
   * @param {Function} options.onCancel - 取消回调
   * @param {Object} options.calculator - ProfitCalculator 实例
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.calculator = options.calculator || null;
    this.isEditing = false;
    this.currentRecordId = null;
  }

  /**
   * 渲染新建表单
   */
  renderCreateForm() {
    this.isEditing = false;
    this.currentRecordId = null;
    this.container.innerHTML = this.getFormHTML();
    this.bindEvents();
  }

  /**
   * 渲染编辑表单
   * @param {Object} order - 要编辑的订单数据
   */
  renderEditForm(order) {
    this.isEditing = true;
    this.currentRecordId = order.recordId || null;
    this.container.innerHTML = this.getFormHTML(order);
    this.bindEvents();
  }

  /**
   * 获取表单 HTML
   * @param {Object} order - 订单数据（编辑模式时传入）
   * @returns {string} HTML 字符串
   */
  getFormHTML(order = {}) {
    const isEditing = this.isEditing;
    const today = Formatter.formatDate(new Date(), 'YYYY-MM-DD');

    return `
      <div class="order-form max-w-4xl mx-auto p-6">
        <h2 class="text-2xl font-bold mb-6">${isEditing ? '编辑订单' : '新建订单'}</h2>
        
        <form id="orderForm" class="space-y-6">
          <!-- 基础信息 -->
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">基础信息</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">日期</label>
                <input type="date" name="日期" value="${order['日期'] || today}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">单号 *</label>
                <input type="text" name="单号" value="${order['单号'] || ''}" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="请输入订单号">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">货号</label>
                <input type="text" name="货号" value="${order['货号'] || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="请输入货号">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input type="text" name="名称" value="${order['名称'] || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="请输入商品名称">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">数量</label>
                <input type="number" name="数量" value="${order['数量'] || 1}" min="1"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select name="状态" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="待处理" ${order['状态'] === '待处理' ? 'selected' : ''}>待处理</option>
                  <option value="采购中" ${order['状态'] === '采购中' ? 'selected' : ''}>采购中</option>
                  <option value="已发货" ${order['状态'] === '已发货' ? 'selected' : ''}>已发货</option>
                  <option value="已完成" ${order['状态'] === '已完成' ? 'selected' : ''}>已完成</option>
                  <option value="取消" ${order['状态'] === '取消' ? 'selected' : ''}>取消</option>
                </select>
              </div>
            </div>
            
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea name="备注" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="可输入订单备注（如：取消、测试单等）">${order['备注'] || ''}</textarea>
            </div>
          </div>

          <!-- 采购信息 -->
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">采购信息</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">采购平台</label>
                <select name="采购平台" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">请选择</option>
                  <option value="拼多多" ${order['采购平台'] === '拼多多' ? 'selected' : ''}>拼多多</option>
                  <option value="1688" ${order['采购平台'] === '1688' ? 'selected' : ''}>1688</option>
                  <option value="淘宝" ${order['采购平台'] === '淘宝' ? 'selected' : ''}>淘宝</option>
                  <option value="其他" ${order['采购平台'] === '其他' ? 'selected' : ''}>其他</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">重量 (kg)</label>
                <input type="number" name="重量" value="${order['重量'] || ''}" step="0.001" min="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="请输入重量（kg）">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">采购链接</label>
                <input type="url" name="采购链接" value="${order['采购链接'] || ''}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="https://">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">运输方式</label>
                <select name="运输方式" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="陆运" ${order['运输方式'] === '陆运' || !order['运输方式'] ? 'selected' : ''}>陆运</option>
                  <option value="陆空联运" ${order['运输方式'] === '陆空联运' ? 'selected' : ''}>陆空联运</option>
                  <option value="空运" ${order['运输方式'] === '空运' ? 'selected' : ''}>空运</option>
                </select>
              </div>
            </div>
            
            <div class="mt-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">采购备注</label>
              <textarea name="采购备注" rows="2" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="可输入采购备注">${order['采购备注'] || ''}</textarea>
            </div>
          </div>

          <!-- 财务信息 -->
          <div class="bg-white p-4 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">财务信息</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">成本 (¥) *</label>
                <input type="number" name="成本" value="${order['成本'] || ''}" step="0.01" min="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="0.00">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">单价 (¥) *</label>
                <input type="number" name="单价" value="${order['单价'] || ''}" step="0.01" min="0" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="0.00">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">佣金 (¥)</label>
                <input type="number" name="佣金" value="${order['佣金'] || ''}" step="0.01" min="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="0.00">
              </div>
            </div>

            <!-- 自动计算结果展示 -->
            <div class="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 class="text-md font-semibold mb-3 text-blue-800">📊 自动计算结果</h4>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">单价（卢布）：</span>
                  <span id="calcUnitPriceRUB" class="font-semibold text-blue-600">₽0.00</span>
                </div>
                <div>
                  <span class="text-gray-600">税：</span>
                  <span id="calcTax" class="font-semibold text-blue-600">¥0.00</span>
                </div>
                <div>
                  <span class="text-gray-600">尾程：</span>
                  <span id="calcLastMile" class="font-semibold text-blue-600">¥0.00</span>
                </div>
                <div>
                  <span class="text-gray-600">运费：</span>
                  <span id="calcShippingFee" class="font-semibold text-blue-600">¥0.00</span>
                </div>
                <div class="col-span-2 md:col-span-1">
                  <span class="text-gray-800 font-bold">利润：</span>
                  <span id="calcProfit" class="font-bold text-lg text-green-600">¥0.00</span>
                </div>
                <div class="col-span-2 md:col-span-1">
                  <span class="text-gray-800 font-bold">利润率：</span>
                  <span id="calcProfitRate" class="font-bold text-lg text-green-600">0.00%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end space-x-4">
            <button type="button" id="btnCancel" 
                    class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              取消
            </button>
            <button type="submit" id="btnSave" 
                    class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              ${isEditing ? '更新' : '保存'}
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const form = document.getElementById('orderForm');
    const btnCancel = document.getElementById('btnCancel');
    
    // 表单提交
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // 取消按钮
    btnCancel.addEventListener('click', () => {
      if (this.options.onCancel) {
        this.options.onCancel();
      }
    });

    // 实时计算（监听相关字段变化）
    const calcFields = ['单价', '成本', '佣金', '重量', '运输方式'];
    calcFields.forEach(fieldName => {
      const input = form.querySelector(`[name="${fieldName}"]`);
      if (input) {
        input.addEventListener('input', () => this.handleRealtimeCalculation());
        input.addEventListener('change', () => this.handleRealtimeCalculation());
      }
    });

    // 初始计算（编辑模式）
    if (this.isEditing) {
      this.handleRealtimeCalculation();
    }
  }

  /**
   * 处理实时计算
   */
  handleRealtimeCalculation() {
    if (!this.calculator) return;

    const formData = this.getFormData();
    
    // 只有当有足够数据时才计算
    if (formData['单价'] > 0) {
      const result = this.calculator.calculateProfit(formData);
      
      // 更新显示
      document.getElementById('calcUnitPriceRUB').textContent = 
        Formatter.formatCurrencyRUB(result.unitPriceRUB, true);
      document.getElementById('calcTax').textContent = 
        Formatter.formatCurrency(result.tax, true);
      document.getElementById('calcLastMile').textContent = 
        Formatter.formatCurrency(result.lastMile, true);
      document.getElementById('calcShippingFee').textContent = 
        Formatter.formatCurrency(result.shippingFee, true);
      document.getElementById('calcProfit').textContent = 
        Formatter.formatCurrency(result.profit, true);
      
      const profitRate = result.profit / result.unitPrice;
      document.getElementById('calcProfitRate').textContent = 
        Formatter.formatProfitRate(result.profit, result.unitPrice);
      
      // 根据利润率设置颜色
      const rateColor = Formatter.getProfitRateColor(profitRate);
      document.getElementById('calcProfit').className = `font-bold text-lg ${rateColor}`;
      document.getElementById('calcProfitRate').className = `font-bold text-lg ${rateColor}`;
    }
  }

  /**
   * 获取表单数据
   * @returns {Object} 表单数据对象
   */
  getFormData() {
    const form = document.getElementById('orderForm');
    const formData = new FormData(form);
    const data = {};

    // 处理所有字段
    for (const [key, value] of formData.entries()) {
      if (value === '') continue;
      
      // 数字字段转换
      if (['数量', '成本', '单价', '佣金', '运费', '重量', '尾程', '税', '利润'].includes(key)) {
        data[key] = parseFloat(value) || 0;
      } else {
        data[key] = value;
      }
    }

    return data;
  }

  /**
   * 处理表单提交
   */
  handleSubmit() {
    const data = this.getFormData();
    
    // 验证
    const validation = Validator.validateOrder(data, false);
    if (!validation.valid) {
      Validator.showErrors(validation.errors);
      return;
    }

    // 如果提供了计算器，自动计算
    if (this.calculator && data['单价'] > 0) {
      const calculated = this.calculator.calculateProfit(data);
      Object.assign(data, calculated);
    }

    // 回调
    if (this.options.onSave) {
      if (this.isEditing && this.currentRecordId) {
        this.options.onSave(this.currentRecordId, data);
      } else {
        this.options.onSave(data);
      }
    }
  }

  /**
   * 销毁表单
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderForm;
}
