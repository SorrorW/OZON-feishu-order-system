/**
 * OrderList - 订单列表组件
 * 
 * 使用 Tabulator 实现可排序、可筛选的订单表格
 */

class OrderList {
  /**
   * 构造函数
   * @param {HTMLElement} container - 容器元素
   * @param {Object} options - 配置选项
   * @param {Function} options.onEdit - 编辑订单回调
   * @param {Function} options.onDelete - 删除订单回调
   * @param {Function} options.onView - 查看订单详情回调
   */
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.table = null;         // Tabulator 实例
    this.data = [];            // 订单数据
    this.filters = {};         // 当前筛选条件
  }

  /**
   * 初始化表格
   */
  init() {
    // 定义表格列
    const columns = [
      {
        title: '日期',
        field: '日期',
        width: 100,
        sorter: 'string',
        formatter: (cell) => {
          const value = cell.getValue();
          return Formatter.formatDate(value, 'YYYY-MM-DD');
        },
      },
      {
        title: '单号',
        field: '单号',
        width: 120,
        sorter: 'string',
        headerFilter: 'input',
      },
      {
        title: '货号',
        field: '货号',
        width: 100,
        sorter: 'string',
        headerFilter: 'input',
      },
      {
        title: '名称',
        field: '名称',
        width: 150,
        sorter: 'string',
        headerFilter: 'input',
        formatter: (cell) => {
          const value = cell.getValue();
          return Formatter.truncateText(value, 20);
        },
      },
      {
        title: '数量',
        field: '数量',
        width: 60,
        sorter: 'number',
        hozAlign: 'right',
      },
      {
        title: '成本',
        field: '成本',
        width: 80,
        sorter: 'number',
        hozAlign: 'right',
        formatter: (cell) => Formatter.formatCurrency(cell.getValue(), false),
      },
      {
        title: '单价',
        field: '单价',
        width: 80,
        sorter: 'number',
        hozAlign: 'right',
        formatter: (cell) => Formatter.formatCurrency(cell.getValue(), false),
      },
      {
        title: '利润',
        field: '利润',
        width: 90,
        sorter: 'number',
        hozAlign: 'right',
        formatter: (cell) => {
          const value = cell.getValue();
          const unitPrice = cell.getRow().getData()['单价'] || 1;
          const profitRate = value / unitPrice;
          const colorClass = Formatter.getProfitRateColor(profitRate);
          return `<span class="${colorClass} font-semibold">${Formatter.formatCurrency(value, false)}</span>`;
        },
      },
      {
        title: '利润率',
        field: '利润',
        width: 80,
        sorter: 'number',
        hozAlign: 'right',
        formatter: (cell) => {
          const profit = cell.getValue() || 0;
          const unitPrice = cell.getRow().getData()['单价'] || 1;
          const rate = profit / unitPrice;
          const colorClass = Formatter.getProfitRateColor(rate);
          return `<span class="${colorClass} font-semibold">${(rate * 100).toFixed(2)}%</span>`;
        },
      },
      {
        title: '状态',
        field: '状态',
        width: 90,
        sorter: 'string',
        headerFilter: 'select',
        headerFilterParams: {
          '': '全部',
          '待处理': '待处理',
          '采购中': '采购中',
          '已发货': '已发货',
          '已完成': '已完成',
          '取消': '取消',
        },
        formatter: (cell) => {
          const status = cell.getValue();
          const classNames = Formatter.getStatusClass(status);
          return `<span class="px-2 py-1 rounded-full text-xs font-semibold ${classNames}">${status || '待处理'}</span>`;
        },
      },
      {
        title: '操作',
        width: 120,
        hozAlign: 'center',
        formatter: () => `
          <button class="btn-view text-blue-600 hover:text-blue-800 mr-2" title="查看">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-edit text-green-600 hover:text-green-800 mr-2" title="编辑">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-delete text-red-600 hover:text-red-800" title="删除">
            <i class="fas fa-trash"></i>
          </button>
        `,
        cellClick: (e, cell) => {
          const rowData = cell.getRow().getData();
          const target = e.target.closest('button');
          
          if (!target) return;
          
          if (target.classList.contains('btn-view') && this.options.onView) {
            this.options.onView(rowData);
          } else if (target.classList.contains('btn-edit') && this.options.onEdit) {
            this.options.onEdit(rowData);
          } else if (target.classList.contains('btn-delete') && this.options.onDelete) {
            this.options.onDelete(rowData);
          }
        },
      },
    ];

    // 创建 Tabulator 表格
    this.table = new Tabulator(this.container, {
      data: this.data,
      columns: columns,
      layout: 'fitColumns',
      responsiveLayout: 'hide',
      pagination: 'local',
      paginationSize: 20,
      paginationSizeSelector: [10, 20, 50, 100],
      movableColumns: true,
      initialSort: [{ column: '日期', dir: 'desc' }],
      locale: 'zh-cn',
      langs: {
        'zh-cn': {
          pagination: {
            page_size: '每页显示',
            first: '首页',
            first_title: '首页',
            last: '末页',
            last_title: '末页',
            prev: '上一页',
            prev_title: '上一页',
            next: '下一页',
            next_title: '下一页',
          },
        },
      },
      placeholder: '暂无订单数据',
    });
  }

  /**
   * 加载订单数据
   * @param {Array<Object>} data - 订单数组
   */
  loadData(data) {
    this.data = data;
    if (this.table) {
      this.table.setData(data);
    }
  }

  /**
   * 添加订单
   * @param {Object} order - 订单对象
   */
  addOrder(order) {
    if (this.table) {
      this.table.addData([order], true);  // true = 添加到顶部
    }
  }

  /**
   * 更新订单
   * @param {string} recordId - 记录 ID
   * @param {Object} updatedOrder - 更新后的订单数据
   */
  updateOrder(recordId, updatedOrder) {
    if (this.table) {
      const row = this.table.getRow(recordId);
      if (row) {
        row.update(updatedOrder);
      }
    }
  }

  /**
   * 删除订单
   * @param {string} recordId - 记录 ID
   */
  deleteOrder(recordId) {
    if (this.table) {
      const row = this.table.getRow(recordId);
      if (row) {
        row.delete();
      }
    }
  }

  /**
   * 应用筛选
   * @param {Object} filters - 筛选条件
   */
  applyFilters(filters) {
    this.filters = { ...this.filters, ...filters };
    
    if (!this.table) return;
    
    // 清除所有筛选
    this.table.clearFilter();
    
    // 应用新筛选
    const filterArray = [];
    for (const [key, value] of Object.entries(this.filters)) {
      if (value !== '' && value !== null && value !== undefined) {
        filterArray.push({ field: key, type: '=', value: value });
      }
    }
    
    if (filterArray.length > 0) {
      this.table.setFilter(filterArray);
    }
  }

  /**
   * 清除所有筛选
   */
  clearFilters() {
    this.filters = {};
    if (this.table) {
      this.table.clearFilter();
    }
  }

  /**
   * 获取当前显示的数据
   * @returns {Array<Object>}
   */
  getData() {
    return this.table ? this.table.getData() : [];
  }

  /**
   * 导出为 CSV
   */
  exportCSV() {
    if (this.table) {
      this.table.download('csv', '订单数据.csv', { bom: true });
    }
  }

  /**
   * 销毁表格
   */
  destroy() {
    if (this.table) {
      this.table.destroy();
      this.table = null;
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderList;
}
