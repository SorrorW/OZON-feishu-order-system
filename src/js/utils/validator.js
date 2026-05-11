/**
 * Validator - 表单验证工具
 */

const Validator = {
  /**
   * 验证订单数据
   * @param {Object} order - 订单数据
   * @param {boolean} isPartial - 是否部分验证（用于实时保存）
   * @returns {{ valid: boolean, errors: Object }}
   */
  validateOrder(order, isPartial = false) {
    const errors = {};

    // 单号：必填，且格式正确
    if (!isPartial || order['单号'] !== undefined) {
      if (!order['单号'] || order['单号'].trim() === '') {
        errors['单号'] = '单号不能为空';
      }
    }

    // 单价：必填，且为正数
    if (!isPartial || order['单价'] !== undefined) {
      if (!order['单价'] || order['单价'] <= 0) {
        errors['单价'] = '单价必须大于0';
      }
    }

    // 成本：如果填写，必须为正数
    if (order['成本'] !== undefined && order['成本'] < 0) {
      errors['成本'] = '成本不能为负数';
    }

    // 重量：如果填写，必须为正数
    if (order['重量'] !== undefined && order['重量'] < 0) {
      errors['重量'] = '重量不能为负数';
    }

    // 佣金：如果填写，必须为正数
    if (order['佣金'] !== undefined && order['佣金'] < 0) {
      errors['佣金'] = '佣金不能为负数';
    }

    // 采购链接：如果填写，必须是有效 URL
    if (order['采购链接'] && !this.isValidURL(order['采购链接'])) {
      errors['采购链接'] = '请输入有效的 URL';
    }

    // 运输方式：必须是允许的值
    if (order['运输方式'] && !['空运', '陆空联运', '陆运'].includes(order['运输方式'])) {
      errors['运输方式'] = '运输方式必须是：空运、陆空联运、陆运之一';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
    };
  },

  /**
   * 验证配置数据
   * @param {Object} config - 配置数据
   * @returns {{ valid: boolean, errors: Object }}
   */
  validateConfig(config) {
    const errors = {};

    if (config.rubleExchangeRate !== undefined) {
      if (!config.rubleExchangeRate || config.rubleExchangeRate <= 0) {
        errors['卢布汇率'] = '汇率必须大于0';
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
    };
  },

  /**
   * 验证必填字段（用于创建订单）
   * @param {Object} order - 订单数据
   * @returns {{ valid: boolean, errors: Object }}
   */
  validateRequired(order) {
    const requiredFields = ['单号', '单价'];
    const errors = {};

    for (const field of requiredFields) {
      if (!order[field] || (typeof order[field] === 'string' && order[field].trim() === '')) {
        errors[field] = `${field}是必填项`;
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors: errors,
    };
  },

  /**
   * 检查是否为有效 URL
   * @param {string} url - URL 字符串
   * @returns {boolean}
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 显示验证错误
   * @param {Object} errors - 错误对象（字段名 -> 错误信息）
   */
  showErrors(errors) {
    // 清除旧的错误提示
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.error-field').forEach(el => el.classList.remove('error-field'));

    // 显示新的错误
    for (const [field, message] of Object.entries(errors)) {
      const input = document.querySelector(`[name="${field}"]`);
      if (input) {
        input.classList.add('error-field');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-500 text-xs mt-1';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
      }
    }
  },

  /**
   * 清除所有验证错误
   */
  clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.error-field').forEach(el => el.classList.remove('error-field'));
  },
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validator;
}
