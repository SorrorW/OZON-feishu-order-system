/**
 * ConfigPanel - 配置面板组件
 */

class ConfigPanel {
  /**
   * 构造函数
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 配置选项
   * @param {Function} options.onSave - 保存回调
   * @param {Function} options.onBack - 返回回调
   * @param {Object} options.calculator - ProfitCalculator 实例
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.calculator = options.calculator || null;
    this.currentRate = 89.12;  // 默认汇率
  }

  /**
   * 渲染配置面板
   * @param {Object} config - 当前配置（含汇率）
   */
  render(config = {}) {
    this.currentRate = config.rubleExchangeRate || 89.12;
    const updatedAt = config.updatedAt ? Formatter.formatDate(config.updatedAt, 'YYYY-MM-DD HH:mm') : '从未更新';

    this.container.innerHTML = `
      <div class="config-panel max-w-2xl mx-auto p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">系统配置</h2>
          <button id="btnBackConfig" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            返回
          </button>
        </div>

        <form id="configForm" class="space-y-6">
          <!-- 汇率配置 -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">💱 汇率配置</h3>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                卢布汇率（¥1 = ₽?）
              </label>
              <div class="flex items-center space-x-2">
                <span class="text-gray-500">¥1 =</span>
                <input type="number" 
                       name="rubleExchangeRate" 
                       value="${this.currentRate}" 
                       step="0.0001" 
                       min="0.0001"
                       class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="请输入卢布汇率">
                <span class="text-gray-500">₽</span>
              </div>
              <p class="mt-1 text-xs text-gray-500">用于计算单价（卢布）= 单价 × 汇率</p>
            </div>

            <div class="p-4 bg-blue-50 rounded-lg">
              <div class="text-sm text-gray-600 mb-2">📊 计算示例：</div>
              <div class="text-sm font-mono">
                <div>如果单价 = <span class="font-bold">¥100</span></div>
                <div>则 单价（卢布）= 100 × <span id="exampleRate">${this.currentRate}</span> = <span class="font-bold text-blue-600" id="exampleResult">${(100 * this.currentRate).toFixed(2)}</span> ₽</div>
              </div>
            </div>

            <div class="mt-4 text-sm text-gray-500">
              最后更新：<span id="lastUpdateTime">${updatedAt}</span>
            </div>
          </div>

          <!-- 计算公式参考 -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">📐 利润计算公式</h3>
            
            <div class="space-y-3 text-sm font-mono">
              <div class="p-3 bg-gray-50 rounded">
                <div class="text-gray-700 font-semibold mb-1">核心公式：</div>
                <div>利润 = 单价 - 成本 - 佣金 - 运费 - 税 - 尾程</div>
              </div>

              <div class="p-3 bg-gray-50 rounded">
                <div class="text-gray-700 font-semibold mb-1">税：</div>
                <div>税 = 单价 × 3%</div>
              </div>

              <div class="p-3 bg-gray-50 rounded">
                <div class="text-gray-700 font-semibold mb-1">尾程：</div>
                <div>尾程 = MAX(MIN(单价（卢布）× 2%, 200), 15) ÷ 11.89</div>
              </div>

              <div class="p-3 bg-gray-50 rounded">
                <div class="text-gray-700 font-semibold mb-1">单价（卢布）：</div>
                <div>单价（卢布）= 单价 × 卢布汇率</div>
              </div>

              <div class="p-3 bg-gray-50 rounded">
                <div class="text-gray-700 font-semibold mb-1">运费：</div>
                <div class="text-xs text-gray-600">
                  根据运输方式、重量、单价（卢布）三个条件计算<br>
                  共有 15 条规则（详见架构设计文档）
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex justify-end space-x-4">
            <button type="button" id="btnResetConfig" 
                    class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              重置
            </button>
            <button type="submit" id="btnSaveConfig" 
                    class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              保存配置
            </button>
          </div>
        </form>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const form = document.getElementById('configForm');
    const btnBack = document.getElementById('btnBackConfig');
    const btnReset = document.getElementById('btnResetConfig');
    const inputRate = form.querySelector('[name="rubleExchangeRate"]');

    // 返回按钮
    if (btnBack && this.options.onBack) {
      btnBack.addEventListener('click', () => this.options.onBack());
    }

    // 重置按钮
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        inputRate.value = this.currentRate;
        this.updateExample(inputRate.value);
      });
    }

    // 实时预览
    if (inputRate) {
      inputRate.addEventListener('input', (e) => {
        this.updateExample(e.target.value);
      });
    }

    // 表单提交
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  /**
   * 更新计算示例
   * @param {string} rate - 汇率值
   */
  updateExample(rate) {
    const exampleRate = document.getElementById('exampleRate');
    const exampleResult = document.getElementById('exampleResult');

    if (exampleRate && exampleResult) {
      const rateNum = parseFloat(rate) || 0;
      exampleRate.textContent = rateNum.toFixed(4);
      exampleResult.textContent = (100 * rateNum).toFixed(2);
    }
  }

  /**
   * 处理表单提交
   */
  handleSubmit() {
    const form = document.getElementById('configForm');
    const formData = new FormData(form);
    const newRate = parseFloat(formData.get('rubleExchangeRate'));

    // 验证
    const validation = Validator.validateConfig({ rubleExchangeRate: newRate });
    if (!validation.valid) {
      Validator.showErrors(validation.errors);
      return;
    }

    Validator.clearErrors();

    // 更新计算器
    if (this.calculator) {
      this.calculator.updateExchangeRate(newRate);
    }

    // 回调
    if (this.options.onSave) {
      this.options.onSave({
        rubleExchangeRate: newRate,
        updatedAt: new Date().toISOString(),
      });
    }

    // 提示成功
    this.showMessage('配置已保存', 'success');
  }

  /**
   * 显示提示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型（success/error）
   */
  showMessage(message, type = 'success') {
    // 移除旧的消息
    const oldMsg = this.container.querySelector('.message-toast');
    if (oldMsg) oldMsg.remove();

    // 创建新消息
    const toast = document.createElement('div');
    toast.className = `message-toast fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 3 秒后自动消失
    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * 销毁面板
   */
  destroy() {
    this.container.innerHTML = '';
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfigPanel;
}
