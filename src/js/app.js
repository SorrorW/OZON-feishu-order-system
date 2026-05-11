/**
 * OrderApp - 主应用逻辑
 * 
 * 负责：
 * - 初始化所有组件
 * - 管理页面路由（列表/表单/详情/配置）
 * - 协调各组件之间的通信
 */

class OrderApp {
  /**
   * 构造函数
   * @param {Object} config - 应用配置
   * @param {string} config.baseToken - 多维表格的 base_token
   * @param {string} config.tableId - 订单表的 table_id
   * @param {string} config.configTableId - 配置表的 table_id
   */
  constructor(config) {
    this.config = config;
    this.api = new FeishuAPI(config);
    this.calculator = new ProfitCalculator(89.12);  // 默认汇率
    this.currentView = 'list';  // list | create | edit | detail | config
    this.currentOrderId = null;
    
    // 组件实例
    this.orderList = null;
    this.orderForm = null;
    this.orderDetail = null;
    this.configPanel = null;
    
    // 缓存数据
    this.orders = [];
    this.configData = null;
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      // 1. 显示加载提示
      this.showLoading('正在初始化...');
      
      // 2. 测试 API 连接
      await this.api.testConnection();
      
      // 3. 获取配置（汇率）
      await this.loadConfig();
      
      // 4. 加载订单数据
      await this.loadOrders();
      
      // 5. 渲染主界面
      this.renderMainUI();
      
      // 6. 显示订单列表
      this.showListView();
      
      this.hideLoading();
    } catch (error) {
      console.error('[OrderApp] 初始化失败:', error);
      this.showError('初始化失败: ' + error.message);
      this.hideLoading();
    }
  }

  /**
   * 加载配置（汇率）
   */
  async loadConfig() {
    try {
      this.configData = await this.api.getConfig();
      this.calculator.updateExchangeRate(this.configData.rubleExchangeRate);
    } catch (error) {
      console.error('[OrderApp] 加载配置失败:', error);
      // 使用默认配置
      this.configData = {
        rubleExchangeRate: 89.12,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 加载订单数据
   */
  async loadOrders() {
    try {
      const result = await this.api.getOrders({ pageSize: 100 });
      this.orders = result.records;
    } catch (error) {
      console.error('[OrderApp] 加载订单失败:', error);
      throw error;
    }
  }

  /**
   * 渲染主界面（侧边栏骨架）
   */
  renderMainUI() {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      console.error('[OrderApp] 找不到 #app 容器');
      return;
    }

    appContainer.innerHTML = `
      <!-- 顶部导航 -->
      <div class="bg-blue-600 text-white p-4 shadow-lg">
        <div class="flex justify-between items-center">
          <h1 class="text-xl font-bold">🛒 订单管理系统</h1>
          <div class="space-x-2">
            <button id="btnConfig" class="text-white hover:text-blue-200" title="配置">
              <span class="text-xl">⚙️</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 工具栏 -->
      <div class="p-4 bg-gray-50 border-b">
        <div class="flex flex-wrap gap-2">
          <button id="btnCreate" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            + 新建订单
          </button>
          <button id="btnRefresh" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            🔄 刷新
          </button>
          <button id="btnExport" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            📤 导出
          </button>
          <div class="flex-1"></div>
          <input type="text" id="searchInput" placeholder="搜索单号、货号、名称..." 
                 class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64">
        </div>
      </div>

      <!-- 主内容区 -->
      <div id="mainContent" class="p-6">
        <!-- 动态内容会渲染到这里 -->
      </div>
    `;

    this.bindMainEvents();
  }

  /**
   * 绑定主界面事件
   */
  bindMainEvents() {
    const btnCreate = document.getElementById('btnCreate');
    const btnRefresh = document.getElementById('btnRefresh');
    const btnExport = document.getElementById('btnExport');
    const btnConfig = document.getElementById('btnConfig');
    const searchInput = document.getElementById('searchInput');

    // 新建订单
    if (btnCreate) {
      btnCreate.addEventListener('click', () => this.showCreateView());
    }

    // 刷新
    if (btnRefresh) {
      btnRefresh.addEventListener('click', async () => {
        await this.loadOrders();
        if (this.orderList) {
          this.orderList.loadData(this.orders);
        }
      });
    }

    // 导出
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        if (this.orderList) {
          this.orderList.exportCSV();
        }
      });
    }

    // 配置
    if (btnConfig) {
      btnConfig.addEventListener('click', () => this.showConfigView());
    }

    // 搜索
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const keyword = e.target.value.trim();
          if (this.orderList) {
            if (keyword) {
              // 简单搜索（单号、货号、名称）
              this.orderList.table.setFilter([
                { field: '单号', type: 'like', value: keyword },
                { field: '货号', type: 'like', value: keyword },
                { field: '名称', type: 'like', value: keyword },
              ]);
            } else {
              this.orderList.clearFilters();
            }
          }
        }, 300);
      });
    }
  }

  // ==================== 视图切换 ====================

  /**
   * 显示订单列表视图
   */
  showListView() {
    this.currentView = 'list';
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = '<div id="orderTable"></div>';
    
    const tableContainer = document.getElementById('orderTable');
    this.orderList = new OrderList(tableContainer, {
      onEdit: (order) => this.showEditView(order),
      onDelete: (order) => this.handleDeleteOrder(order),
      onView: (order) => this.showDetailView(order),
    });
    this.orderList.init();
    this.orderList.loadData(this.orders);
  }

  /**
   * 显示新建订单视图
   */
  showCreateView() {
    this.currentView = 'create';
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = '<div id="orderFormContainer"></div>';
    
    const formContainer = document.getElementById('orderFormContainer');
    this.orderForm = new OrderForm(formContainer, {
      calculator: this.calculator,
      onSave: (order) => this.handleCreateOrder(order),
      onCancel: () => this.showListView(),
    });
    this.orderForm.renderCreateForm();
  }

  /**
   * 显示编辑订单视图
   * @param {Object} order - 要编辑的订单
   */
  showEditView(order) {
    this.currentView = 'edit';
    this.currentOrderId = order.recordId;
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = '<div id="orderFormContainer"></div>';
    
    const formContainer = document.getElementById('orderFormContainer');
    this.orderForm = new OrderForm(formContainer, {
      calculator: this.calculator,
      onSave: (recordId, order) => this.handleUpdateOrder(recordId, order),
      onCancel: () => this.showListView(),
    });
    this.orderForm.renderEditForm(order);
  }

  /**
   * 显示订单详情视图
   * @param {Object} order - 要查看的订单
   */
  showDetailView(order) {
    this.currentView = 'detail';
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = '<div id="orderDetailContainer"></div>';
    
    const detailContainer = document.getElementById('orderDetailContainer');
    this.orderDetail = new OrderDetail(detailContainer, {
      onEdit: (order) => this.showEditView(order),
      onBack: () => this.showListView(),
    });
    this.orderDetail.render(order);
  }

  /**
   * 显示配置视图
   */
  showConfigView() {
    this.currentView = 'config';
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    mainContent.innerHTML = '<div id="configContainer"></div>';
    
    const configContainer = document.getElementById('configContainer');
    this.configPanel = new ConfigPanel(configContainer, {
      calculator: this.calculator,
      onSave: (config) => this.handleSaveConfig(config),
      onBack: () => this.showListView(),
    });
    this.configPanel.render(this.configData);
  }

  // ==================== 数据操作 ====================

  /**
   * 处理创建订单
   * @param {Object} order - 订单数据
   */
  async handleCreateOrder(order) {
    try {
      this.showLoading('正在保存...');
      
      const recordId = await this.api.createOrder(order);
      order.recordId = recordId;
      this.orders.unshift(order);
      
      this.hideLoading();
      this.showMessage('订单创建成功', 'success');
      this.showListView();
    } catch (error) {
      console.error('[OrderApp] 创建订单失败:', error);
      this.hideLoading();
      this.showMessage('创建失败: ' + error.message, 'error');
    }
  }

  /**
   * 处理更新订单
   * @param {string} recordId - 记录 ID
   * @param {Object} order - 更新后的订单数据
   */
  async handleUpdateOrder(recordId, order) {
    try {
      this.showLoading('正在更新...');
      
      await this.api.updateOrder(recordId, order);
      
      // 更新本地数据
      const index = this.orders.findIndex(o => o.recordId === recordId);
      if (index !== -1) {
        this.orders[index] = { ...this.orders[index], ...order };
      }
      
      this.hideLoading();
      this.showMessage('订单更新成功', 'success');
      this.showListView();
    } catch (error) {
      console.error('[OrderApp] 更新订单失败:', error);
      this.hideLoading();
      this.showMessage('更新失败: ' + error.message, 'error');
    }
  }

  /**
   * 处理删除订单
   * @param {Object} order - 要删除的订单
   */
  async handleDeleteOrder(order) {
    if (!confirm(`确定要删除订单【${order['单号']}】吗？`)) {
      return;
    }

    try {
      this.showLoading('正在删除...');
      
      await this.api.deleteOrder(order.recordId);
      
      // 从本地数据移除
      this.orders = this.orders.filter(o => o.recordId !== order.recordId);
      
      this.hideLoading();
      this.showMessage('订单已删除', 'success');
      
      // 刷新列表
      if (this.orderList) {
        this.orderList.loadData(this.orders);
      }
    } catch (error) {
      console.error('[OrderApp] 删除订单失败:', error);
      this.hideLoading();
      this.showMessage('删除失败: ' + error.message, 'error');
    }
  }

  /**
   * 处理保存配置
   * @param {Object} config - 配置数据
   */
  async handleSaveConfig(config) {
    try {
      this.showLoading('正在保存配置...');
      
      await this.api.updateConfig(config.rubleExchangeRate, this.configData.recordId);
      this.configData = { ...this.configData, ...config };
      
      this.hideLoading();
      this.showMessage('配置已保存', 'success');
    } catch (error) {
      console.error('[OrderApp] 保存配置失败:', error);
      this.hideLoading();
      this.showMessage('保存失败: ' + error.message, 'error');
    }
  }

  // ==================== UI 工具方法 ====================

  /**
   * 显示加载提示
   * @param {string} message - 加载提示文字
   */
  showLoading(message = '加载中...') {
    // 移除旧的 loading
    this.hideLoading();
    
    const loading = document.createElement('div');
    loading.id = 'loadingOverlay';
    loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loading.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-xl text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div class="text-gray-700">${message}</div>
      </div>
    `;
    document.body.appendChild(loading);
  }

  /**
   * 隐藏加载提示
   */
  hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
      loading.remove();
    }
  }

  /**
   * 显示提示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型（success/error）
   */
  showMessage(message, type = 'success') {
    // 移除旧的消息
    const oldMsg = document.querySelector('.message-toast');
    if (oldMsg) oldMsg.remove();

    // 创建新消息
    const toast = document.createElement('div');
    toast.className = `message-toast fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white font-medium`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 3 秒后自动消失
    setTimeout(() => toast.remove(), 3000);
  }

  /**
   * 显示错误页面
   * @param {string} message - 错误信息
   */
  showError(message) {
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="text-center">
            <div class="text-6xl mb-4">⚠️</div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">出错了</h2>
            <p class="text-gray-600">${message}</p>
          </div>
        </div>
      `;
    }
  }
}

// ==================== 应用启动 ====================
// 等待 DOM 加载完成后启动应用
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 从全局配置对象读取（config.js 中定义）
    const feishuConfig = typeof FEISHU_CONFIG !== 'undefined' ? FEISHU_CONFIG : null;
    
    if (!feishuConfig) {
      console.error('[OrderApp] 错误：未找到配置文件。请参考 config.template.js 创建 config.js');
      document.getElementById('app').innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="text-center max-w-md mx-auto p-6">
            <div class="text-6xl mb-4">⚠️</div>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">配置缺失</h2>
            <p class="text-gray-600 mb-4">未找到配置文件 <code class="bg-gray-200 px-2 py-1 rounded">config.js</code></p>
            <div class="text-left bg-gray-100 p-4 rounded-lg text-sm">
              <p class="font-bold mb-2">解决方法：</p>
              <ol class="list-decimal list-inside space-y-1">
                <li>复制配置模板：<code class="bg-white px-1">cp config.template.js config.js</code></li>
                <li>编辑 <code class="bg-white px-1">config.js</code>，填写真实配置</li>
                <li>刷新页面</li>
              </ol>
            </div>
          </div>
        </div>
      `;
      return;
    }
    
    // 验证必要配置
    if (!feishuConfig.appId || !feishuConfig.appSecret) {
      throw new Error('请在 config.js 中配置 appId 和 appSecret');
    }
    if (!feishuConfig.baseToken) {
      throw new Error('请在 config.js 中配置 baseToken');
    }
    if (!feishuConfig.tableId) {
      console.warn('[OrderApp] 警告：tableId 未配置，请在多维表格中创建订单表并填写 tableId');
    }
    
    // 创建应用实例
    const app = new OrderApp(feishuConfig);
    
    // 初始化应用
    await app.init();
    
    // 将 app 挂载到 window（方便调试）
    window.orderApp = app;
  } catch (error) {
    console.error('[OrderApp] 启动失败:', error);
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="text-center max-w-md mx-auto p-6">
          <div class="text-6xl mb-4">⚠️</div>
          <h2 class="text-2xl font-bold text-gray-800 mb-4">启动失败</h2>
          <p class="text-gray-600 mb-4">${error.message}</p>
          <div class="text-left bg-gray-100 p-4 rounded-lg text-sm">
            <p class="font-bold mb-2">请检查：</p>
            <ul class="list-disc list-inside space-y-1">
              <li>config.js 文件是否存在</li>
              <li>配置项是否填写正确</li>
              <li>飞书应用权限是否开启</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }
});

// 导出（兼容 Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderApp;
}
