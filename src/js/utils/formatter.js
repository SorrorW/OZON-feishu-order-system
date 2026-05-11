/**
 * Formatter - 数据格式化工具
 * 
 * 用于格式化货币、日期、数字等显示
 */

const Formatter = {
  /**
   * 格式化货币（人民币）
   * @param {number} value - 数值
   * @param {boolean} showSymbol - 是否显示 ¥ 符号
   * @returns {string} 格式化后的字符串（如 ¥1,234.56）
   */
  formatCurrency(value, showSymbol = true) {
    if (value === null || value === undefined || isNaN(value)) {
      return showSymbol ? '¥0.00' : '0.00';
    }
    const formatted = Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return showSymbol ? `¥${formatted}` : formatted;
  },

  /**
   * 格式化货币（卢布）
   * @param {number} value - 数值
   * @param {boolean} showSymbol - 是否显示 ₽ 符号
   * @returns {string} 格式化后的字符串（如 ₽12,345.67）
   */
  formatCurrencyRUB(value, showSymbol = true) {
    if (value === null || value === undefined || isNaN(value)) {
      return showSymbol ? '₽0.00' : '0.00';
    }
    const formatted = Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return showSymbol ? `₽${formatted}` : formatted;
  },

  /**
   * 格式化数字（保留指定位小数）
   * @param {number} value - 数值
   * @param {number} decimals - 小数位数（默认 2）
   * @returns {string} 格式化后的字符串
   */
  formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0'.padEnd(decimals + 2, '.0');
    }
    return Number(value).toFixed(decimals);
  },

  /**
   * 格式化重量（kg）
   * @param {number} value - 重量（kg）
   * @returns {string} 格式化后的字符串（如 1.234 kg）
   */
  formatWeight(value) {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.000 kg';
    }
    return `${Number(value).toFixed(3)} kg`;
  },

  /**
   * 格式化日期
   * @param {string|Date} date - 日期字符串或 Date 对象
   * @param {string} format - 格式化模板（默认 'YYYY-MM-DD'）
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, format = 'YYYY-MM-DD') {
    if (!date) return '';
    
    let dateObj;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return '';
    }

    if (isNaN(dateObj.getTime())) return '';

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  /**
   * 格式化利润率（百分比）
   * @param {number} profit - 利润
   * @param {number} unitPrice - 单价
   * @returns {string} 格式化后的百分比（如 15.23%）
   */
  formatProfitRate(profit, unitPrice) {
    if (!unitPrice || unitPrice === 0) return '0.00%';
    const rate = (profit / unitPrice) * 100;
    return `${rate.toFixed(2)}%`;
  },

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的文件大小（如 1.23 MB）
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * 截断文本（超出部分用 ... 代替）
   * @param {string} text - 原文本
   * @param {number} maxLength - 最大长度
   * @returns {string} 截断后的文本
   */
  truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * 转义 HTML 特殊字符（防止 XSS）
   * @param {string} text - 原文本
   * @returns {string} 转义后的文本
   */
  escapeHTML(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * 生成订单状态对应的 Tailwind CSS 类名
   * @param {string} status - 订单状态
   * @returns {string} Tailwind CSS 类名
   */
  getStatusClass(status) {
    const statusClasses = {
      '待处理': 'bg-yellow-100 text-yellow-800',
      '采购中': 'bg-blue-100 text-blue-800',
      '已发货': 'bg-purple-100 text-purple-800',
      '已完成': 'bg-green-100 text-green-800',
      '取消': 'bg-red-100 text-red-800',
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  },

  /**
   * 计算利润率对应的颜色类名
   * @param {number} profitRate - 利润率（小数，如 0.15 表示 15%）
   * @returns {string} Tailwind CSS 文字颜色类名
   */
  getProfitRateColor(profitRate) {
    if (profitRate >= 0.2) return 'text-green-600';      // ≥ 20%：绿色
    if (profitRate >= 0.1) return 'text-blue-600';       // 10%-20%：蓝色
    if (profitRate >= 0.05) return 'text-yellow-600';    // 5%-10%：黄色
    if (profitRate >= 0) return 'text-orange-600';        // 0%-5%：橙色
    return 'text-red-600';                                 // < 0%：红色
  },
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Formatter;
}
