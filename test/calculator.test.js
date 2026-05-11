/**
 * ProfitCalculator 单元测试
 * 
 * 测试所有利润计算算法（税、尾程、运费、利润）
 */

const ProfitCalculator = require('../src/js/calculator.js');

// 测试用例辅助函数
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ 测试失败: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ 通过: ${message}`);
  }
}

function runTest(name, testFn) {
  console.log(`\n📝 测试套件: ${name}`);
  try {
    testFn();
  } catch (error) {
    console.error(`❌ 测试套件失败: ${name}`);
    console.error(error);
    process.exit(1);
  }
}

// ==================== 测试开始 ====================

// 初始化计算器
const calculator = new ProfitCalculator(89.12);  // 卢布汇率 89.12

// 1. 测试计算税
runTest('计算税 (calculateTax)', () => {
  // 正常情况
  assert(
    calculator.calculateTax(100) === 3.00,
    '单价 100 元，税 = 100 × 3% = 3.00'
  );
  
  assert(
    calculator.calculateTax(50.5) === 1.52,  // 50.5 * 0.03 = 1.515 → 四舍五入为 1.52
    '单价 50.5 元，税 = 50.5 × 3% = 1.52'
  );
  
  // 边界情况
  assert(
    calculator.calculateTax(0) === 0,
    '单价 0 元，税 = 0'
  );
  
  assert(
    calculator.calculateTax(null) === 0,
    '单价为 null，税 = 0'
  );
});

// 2. 测试计算尾程
runTest('计算尾程 (calculateLastMile)', () => {
  // unitPriceRUB = 100 × 89.12 = 8912
  // unitPriceRUB * 0.02 = 178.24
  // MAX(MIN(178.24, 200), 15) = 178.24
  // 尾程 = 178.24 / 11.89 = 14.988... → 14.99
  assert(
    Math.abs(calculator.calculateLastMile(8912) - 14.99) < 0.01,
    '单价（卢布）8912，尾程 ≈ 14.99'
  );
  
  // unitPriceRUB = 1000
  // unitPriceRUB * 0.02 = 20
  // MAX(MIN(20, 200), 15) = 20
  // 尾程 = 20 / 11.89 = 1.682... → 1.68
  assert(
    Math.abs(calculator.calculateLastMile(1000) - 1.68) < 0.01,
    '单价（卢布）1000，尾程 ≈ 1.68'
  );
  
  // unitPriceRUB = 100
  // unitPriceRUB * 0.02 = 2
  // MAX(MIN(2, 200), 15) = 15 (因为 2 < 15)
  // 尾程 = 15 / 11.89 = 1.261... → 1.26
  assert(
    Math.abs(calculator.calculateLastMile(100) - 1.26) < 0.01,
    '单价（卢布）100，尾程 ≈ 1.26 (触发下限 15)'
  );
  
  // unitPriceRUB = 15000
  // unitPriceRUB * 0.02 = 300
  // MAX(MIN(300, 200), 15) = 200 (因为 300 > 200)
  // 尾程 = 200 / 11.89 = 16.82... → 16.82
  assert(
    Math.abs(calculator.calculateLastMile(15000) - 16.82) < 0.01,
    '单价（卢布）15000，尾程 ≈ 16.82 (触发上限 200)'
  );
});

// 3. 测试计算单价（卢布）
runTest('计算单价（卢布）(calculateUnitPriceRUB)', () => {
  assert(
    calculator.calculateUnitPriceRUB(100) === 8912.00,
    '单价 100 元 × 汇率 89.12 = 8912.00 ₽'
  );
  
  assert(
    calculator.calculateUnitPriceRUB(0) === 0,
    '单价 0 元 = 0 ₽'
  );
});

// 4. 测试计算运费（核心复杂逻辑）
runTest('计算运费 (calculateShippingFee)', () => {
  // 空运 + 重量 0.3kg + 单价（卢布）8912（在 7000-250000 区间）
  // 匹配规则：空运, 0.001-5, 7000-250000, factor=46.8, constant=22.88
  // 运费 = 46.8 × 0.3 + 22.88 = 14.04 + 22.88 = 36.92
  assert(
    Math.abs(calculator.calculateShippingFee('空运', 0.3, 8912) - 36.92) < 0.01,
    '空运, 0.3kg, 8912₽ → 36.92'
  );
  
  // 陆运 + 重量 1kg + 单价（卢布）1000（在 1500-7000 区间）
  // 匹配规则：陆运, 0.001-2, 1500-7000, factor=26.0, constant=16.64
  // 运费 = 26.0 × 1 + 16.64 = 42.64
  assert(
    Math.abs(calculator.calculateShippingFee('陆运', 1, 2000) - 42.64) < 0.01,
    '陆运, 1kg, 2000₽ → 42.64'
  );
  
  // 陆空联运 + 重量 10kg + 单价（卢布）1000（在 1-1500 区间）
  // 匹配规则：陆空联运, 0.5-30, 1-1500, factor=26.0, constant=23.92
  // 运费 = 26.0 × 10 + 23.92 = 283.92
  assert(
    Math.abs(calculator.calculateShippingFee('陆空联运', 10, 1000) - 283.92) < 0.01,
    '陆空联运, 10kg, 1000₽ → 283.92'
  );
  
  // 无匹配规则（返回 0）
  assert(
    calculator.calculateShippingFee('空运', 50, 100) === 0,
    '重量 50kg > 30kg，无匹配规则 → 0'
  );
});

// 5. 测试完整利润计算
runTest('完整利润计算 (calculateProfit)', () => {
  const order = {
    unitPrice: 100,      // 单价 100 元
    cost: 50,            // 成本 50 元
    commission: 5,       // 佣金 5 元
    weight: 0.3,         // 重量 0.3 kg
    shippingMethod: '空运',
  };
  
  const result = calculator.calculateProfit(order);
  
  // 手动计算验证
  const unitPriceRUB = 100 * 89.12;  // 8912
  const tax = 100 * 0.03;              // 3
  const lastMile = Math.max(Math.min(8912 * 0.02, 200), 15) / 11.89;  // ≈ 14.99
  const shippingFee = 46.8 * 0.3 + 22.88;  // 36.92 (假设在 7000-250000 区间)
  const profit = 100 - 50 - 5 - 36.92 - 3 - 14.99;  // ≈ -9.91 (亏损)
  
  assert(
    result.unitPriceRUB === 8912.00,
    `单价（卢布）= 8912.00 (实际: ${result.unitPriceRUB})`
  );
  
  assert(
    result.tax === 3.00,
    `税 = 3.00 (实际: ${result.tax})`
  );
  
  assert(
    Math.abs(result.lastMile - 14.99) < 0.01,
    `尾程 ≈ 14.99 (实际: ${result.lastMile})`
  );
  
  assert(
    Math.abs(result.profit - profit) < 0.01,
    `利润 ≈ ${profit.toFixed(2)} (实际: ${result.profit})`
  );
});

// 6. 测试批量计算
runTest('批量计算 (batchCalculate)', () => {
  const orders = [
    { unitPrice: 100, cost: 50, commission: 5, weight: 0.3, shippingMethod: '空运' },
    { unitPrice: 200, cost: 100, commission: 10, weight: 0.5, shippingMethod: '陆运' },
  ];
  
  const results = calculator.batchCalculate(orders);
  
  assert(results.length === 2, '返回 2 条计算结果');
  assert(results[0].unitPrice === 100, '第一条订单单价 = 100');
  assert(results[1].unitPrice === 200, '第二条订单单价 = 200');
});

// 7. 测试汇率更新
runTest('汇率更新 (updateExchangeRate)', () => {
  const oldRate = calculator.getExchangeRate();
  
  calculator.updateExchangeRate(90.00);
  assert(calculator.getExchangeRate() === 90.00, '汇率更新为 90.00');
  
  // 恢复
  calculator.updateExchangeRate(oldRate);
});

// ==================== 测试结束 ====================
console.log('\n🎉 所有测试通过！');
process.exit(0);
