/**
 * ProfitCalculator - 利润计算器（核心模块）
 * 
 * 实现飞书文档中定义的利润计算算法
 * 包括：税、尾程、运费、利润等计算
 */

class ProfitCalculator {
  /**
   * 构造函数
   * @param {number} exchangeRate - 卢布汇率（¥对₽）
   */
  constructor(exchangeRate = 89.12) {
    this.exchangeRate = exchangeRate;
    
    // 运费计算规则
    // 格式：[运输方式, 最小重量, 最大重量, 最小单价卢布, 最大单价卢布, 系数, 常数]
    this.shippingRules = [
      // 单价（卢布）1-1500
      { method: '空运',     minW: 0.001, maxW: 0.5,  minP: 1,      maxP: 1500,   factor: 46.8,  constant: 3.12 },
      { method: '陆空联运', minW: 0.001, maxW: 0.5,  minP: 1,      maxP: 1500,   factor: 36.4,  constant: 3.12 },
      { method: '陆运',     minW: 0.001, maxW: 0.5,  minP: 1,      maxP: 1500,   factor: 26.0,  constant: 3.00 },
      { method: '陆空联运', minW: 0.5,   maxW: 30,   minP: 1,      maxP: 1500,   factor: 26.0,  constant: 23.92 },
      { method: '陆运',     minW: 0.5,   maxW: 30,   minP: 1,      maxP: 1500,   factor: 17.68, constant: 23.92 },
      
      // 单价（卢布）1500-7000
      { method: '空运',     minW: 0.001, maxW: 2,    minP: 1500,   maxP: 7000,   factor: 46.8,  constant: 16.64 },
      { method: '陆空联运', minW: 0.001, maxW: 2,    minP: 1500,   maxP: 7000,   factor: 36.4,  constant: 16.64 },
      { method: '陆运',     minW: 0.001, maxW: 2,    minP: 1500,   maxP: 7000,   factor: 26.0,  constant: 16.64 },
      { method: '陆空联运', minW: 2,      maxW: 30,   minP: 1500,   maxP: 7000,   factor: 26.0,  constant: 37.44 },
      { method: '陆运',     minW: 2,      maxW: 30,   minP: 1500,   maxP: 7000,   factor: 17.68, constant: 37.44 },
      
      // 单价（卢布）7000-250000
      { method: '空运',     minW: 0.001, maxW: 5,    minP: 7000,   maxP: 250000, factor: 46.8,  constant: 22.88 },
      { method: '陆空联运', minW: 0.001, maxW: 5,    minP: 7000,   maxP: 250000, factor: 36.4,  constant: 22.88 },
      { method: '陆运',     minW: 0.001, maxW: 5,    minP: 7000,   maxP: 250000, factor: 26.0,  constant: 22.88 },
      { method: '陆空联运', minW: 5,      maxW: 30,   minP: 7000,   maxP: 250000, factor: 29.12, constant: 64.48 },
      { method: '陆运',     minW: 5,      maxW: 30,   minP: 7000,   maxP: 250000, factor: 23.92, constant: 64.48 },
    ];
  }

  /**
   * 计算税
   * 公式：税 = 单价 × 3%
   * @param {number} unitPrice - 单价（¥）
   * @returns {number} 税（¥，保留两位小数）
   */
  calculateTax(unitPrice) {
    if (!unitPrice || unitPrice <= 0) return 0;
    return Math.round(unitPrice * 0.03 * 100) / 100;
  }

  /**
   * 计算尾程
   * 公式：尾程 = MAX(MIN(单价（卢布）× 2%, 200), 15) ÷ 11.89
   * @param {number} unitPriceRUB - 单价（卢布）
   * @returns {number} 尾程（¥，保留两位小数）
   */
  calculateLastMile(unitPriceRUB) {
    if (!unitPriceRUB || unitPriceRUB <= 0) return 0;
    const feeRUB = Math.max(Math.min(unitPriceRUB * 0.02, 200), 15);
    return Math.round((feeRUB / 11.89) * 100) / 100;
  }

  /**
   * 计算单价（卢布）
   * 公式：单价（卢布）= 单价 × 卢布汇率
   * @param {number} unitPrice - 单价（¥）
   * @returns {number} 单价（卢布）（保留两位小数）
   */
  calculateUnitPriceRUB(unitPrice) {
    if (!unitPrice || unitPrice <= 0) return 0;
    return Math.round(unitPrice * this.exchangeRate * 100) / 100;
  }

  /**
   * 计算运费
   * 根据运输方式、重量、单价（卢布）匹配规则
   * @param {string} method - 运输方式（空运/陆空联运/陆运）
   * @param {number} weight - 重量（kg）
   * @param {number} unitPriceRUB - 单价（卢布）
   * @returns {number} 运费（¥，保留两位小数）
   */
  calculateShippingFee(method, weight, unitPriceRUB) {
    if (!method || !weight || !unitPriceRUB) return 0;
    
    // 查找匹配的规则
    for (const rule of this.shippingRules) {
      if (
        rule.method === method &&
        weight >= rule.minW &&
        weight <= rule.maxW &&
        unitPriceRUB >= rule.minP &&
        unitPriceRUB <= rule.maxP
      ) {
        const fee = rule.factor * weight + rule.constant;
        return Math.round(fee * 100) / 100;
      }
    }
    
    // 无匹配规则，返回 0
    return 0;
  }

  /**
   * 计算完整订单利润
   * 公式：利润 = 单价 - 成本 - 佣金 - 运费 - 税 - 尾程
   * @param {Object} order - 订单数据（部分字段即可）
   * @param {number} order.unitPrice - 单价（¥）
   * @param {number} order.cost - 成本（¥）
   * @param {number} order.commission - 佣金（¥）
   * @param {number} order.weight - 重量（kg）
   * @param {string} order.shippingMethod - 运输方式
   * @param {boolean} skipCalculation - 是否跳过计算（用于手动调整场景）
   * @returns {Object} 完整的订单数据（含所有计算结果）
   */
  calculateProfit(order, skipCalculation = false) {
    const {
      unitPrice = 0,
      cost = 0,
      commission = 0,
      weight = 0,
      shippingMethod = '陆运',
    } = order;
    
    // 计算中间值
    const unitPriceRUB = this.calculateUnitPriceRUB(unitPrice);
    const tax = this.calculateTax(unitPrice);
    const lastMile = this.calculateLastMile(unitPriceRUB);
    const shippingFee = skipCalculation ? (order.shippingFee || 0) : 
      this.calculateShippingFee(shippingMethod, weight, unitPriceRUB);
    
    // 计算利润
    const profit = unitPrice - cost - commission - shippingFee - tax - lastMile;
    
    return {
      ...order,
      unitPriceRUB: Math.round(unitPriceRUB * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      lastMile: Math.round(lastMile * 100) / 100,
      shippingFee: Math.round(shippingFee * 100) / 100,
      profit: Math.round(profit * 100) / 100,
    };
  }

  /**
   * 批量计算利润
   * @param {Array<Object>} orders - 订单数组
   * @returns {Array<Object>} 计算结果数组
   */
  batchCalculate(orders) {
    return orders.map(order => this.calculateProfit(order));
  }

  /**
   * 更新汇率
   * @param {number} newRate - 新汇率
   */
  updateExchangeRate(newRate) {
    if (newRate && newRate > 0) {
      this.exchangeRate = newRate;
    }
  }

  /**
   * 获取当前汇率
   * @returns {number}
   */
  getExchangeRate() {
    return this.exchangeRate;
  }
}

// 导出（兼容浏览器和 Node.js）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfitCalculator;
}
