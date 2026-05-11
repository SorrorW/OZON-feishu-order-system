/**
 * OrderDetail - 订单详情组件（只读）
 */

class OrderDetail {
  /**
   * 构造函数
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 配置选项
   * @param {Function} options.onEdit - 编辑回调
   * @param {Function} options.onBack - 返回回调
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.order = null;
  }

  /**
   * 渲染详情页
   * @param {Object} order - 订单数据
   */
  render(order) {
    this.order = order;
    
    const profitRate = order['利润'] / order['单价'] * 100;
    const profitColor = Formatter.getProfitRateColor(order['利润'] / order['单价']);

    this.container.innerHTML = `
      <div class="order-detail max-w-4xl mx-auto p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">订单详情</h2>
          <div class="space-x-2">
            <button id="btnBack" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              返回列表
            </button>
            <button id="btnEdit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              编辑
            </button>
          </div>
        </div>

        <!-- 基础信息 -->
        <div class="bg-white p-6 rounded-lg shadow mb-6">
          <h3 class="text-lg font-semibold mb-4">基础信息</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span class="text-sm text-gray-600">日期：</span>
              <span class="font-medium">${Formatter.formatDate(order['日期'], 'YYYY-MM-DD')}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">单号：</span>
              <span class="font-medium">${order['单号'] || '无'}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">货号：</span>
              <span class="font-medium">${order['货号'] || '无'}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">名称：</span>
              <span class="font-medium">${order['名称'] || '无'}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">数量：</span>
              <span class="font-medium">${order['数量'] || 0}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">状态：</span>
              <span class="px-2 py-1 rounded-full text-xs font-semibold ${Formatter.getStatusClass(order['状态'])}">${order['状态'] || '待处理'}</span>
            </div>
          </div>
          ${order['备注'] ? `
            <div class="mt-4">
              <span class="text-sm text-gray-600">备注：</span>
              <p class="mt-1 text-gray-800">${order['备注']}</p>
            </div>
          ` : ''}
        </div>

        <!-- 商品图片 -->
        ${order['图片'] && order['图片'].length > 0 ? `
          <div class="bg-white p-6 rounded-lg shadow mb-6">
            <h3 class="text-lg font-semibold mb-4">商品图片</h3>
            <div class="flex space-x-4">
              ${order['图片'].map(img => `
                <img src="${img.url}" alt="${img.name || '商品图片'}" class="w-32 h-32 object-cover rounded-lg shadow">
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 采购信息 -->
        <div class="bg-white p-6 rounded-lg shadow mb-6">
          <h3 class="text-lg font-semibold mb-4">采购信息</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span class="text-sm text-gray-600">采购平台：</span>
              <span class="font-medium">${order['采购平台'] || '无'}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">重量：</span>
              <span class="font-medium">${Formatter.formatWeight(order['重量'])}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">运输方式：</span>
              <span class="font-medium">${order['运输方式'] || '无'}</span>
            </div>
            ${order['采购链接'] ? `
              <div>
                <span class="text-sm text-gray-600">采购链接：</span>
                <a href="${order['采购链接']}" target="_blank" class="text-blue-600 hover:underline">${Formatter.truncateText(order['采购链接'], 40)}</a>
              </div>
            ` : ''}
          </div>
          ${order['采购备注'] ? `
            <div class="mt-4">
              <span class="text-sm text-gray-600">采购备注：</span>
              <p class="mt-1 text-gray-800">${order['采购备注']}</p>
            </div>
          ` : ''}
        </div>

        <!-- 财务信息 -->
        <div class="bg-white p-6 rounded-lg shadow mb-6">
          <h3 class="text-lg font-semibold mb-4">财务信息</h3>
          
          <!-- 利润摘要 -->
          <div class="bg-green-50 p-4 rounded-lg mb-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-sm text-gray-600">单价</div>
                <div class="text-xl font-bold text-gray-800">${Formatter.formatCurrency(order['单价'], true)}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">成本</div>
                <div class="text-xl font-bold text-red-600">-${Formatter.formatCurrency(order['成本'], false)}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">利润</div>
                <div class="text-2xl font-bold ${profitColor}">${Formatter.formatCurrency(order['利润'], true)}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">利润率</div>
                <div class="text-2xl font-bold ${profitColor}">${profitRate.toFixed(2)}%</div>
              </div>
            </div>
          </div>

          <!-- 明细 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span class="text-sm text-gray-600">单价（卢布）：</span>
              <span class="font-medium">${Formatter.formatCurrencyRUB(order['单价（卢布）'], true)}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">佣金：</span>
              <span class="font-medium text-red-600">-${Formatter.formatCurrency(order['佣金'], false)}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">运费：</span>
              <span class="font-medium text-red-600">-${Formatter.formatCurrency(order['运费'], false)}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">税：</span>
              <span class="font-medium text-red-600">-${Formatter.formatCurrency(order['税'], false)}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">尾程：</span>
              <span class="font-medium text-red-600">-${Formatter.formatCurrency(order['尾程'], false)}</span>
            </div>
          </div>
        </div>

        <!-- 计算公式说明 -->
        <div class="bg-gray-50 p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">💰 利润计算公式</h3>
          <div class="space-y-2 text-sm font-mono">
            <div>利润 = 单价 - 成本 - 佣金 - 运费 - 税 - 尾程</div>
            <div class="text-gray-600">
              = ${Formatter.formatCurrency(order['单价'], false)} 
              - ${Formatter.formatCurrency(order['成本'], false)} 
              - ${Formatter.formatCurrency(order['佣金'], false)} 
              - ${Formatter.formatCurrency(order['运费'], false)} 
              - ${Formatter.formatCurrency(order['税'], false)} 
              - ${Formatter.formatCurrency(order['尾程'], false)}
            </div>
            <div class="font-bold text-lg ${profitColor}">= ${Formatter.formatCurrency(order['利润'], true)}</div>
          </div>
        </div>
      </div>
    `;

    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const btnBack = document.getElementById('btnBack');
    const btnEdit = document.getElementById('btnEdit');

    if (btnBack && this.options.onBack) {
      btnBack.addEventListener('click', () => this.options.onBack());
    }

    if (btnEdit && this.options.onEdit) {
      btnEdit.addEventListener('click', () => {
        if (this.order && this.options.onEdit) {
          this.options.onEdit(this.order);
        }
      });
    }
  }

  /**
   * 销毁详情页
   */
  destroy() {
    this.container.innerHTML = '';
    this.order = null;
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderDetail;
}
