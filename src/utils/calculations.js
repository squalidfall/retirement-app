// src/utils/calculations.js
// Utility functions for Canadian Retirement Calculator

// Historical S&P 500 returns (1928-2023, as percent)
export const historicalReturns = [
  43.61, -8.42, -25.12, -8.19, -3.73, 46.59, 27.92, -5.94, 22.76, -6.56,
  31.12, -0.41, -11.59, 21.55, -4.92, 47.67, 33.92, 12.31, -0.65, 9.78,
  20.34, 21.78, 18.79, -1.54, 26.40, 19.45, -10.78, 26.40, 15.03, 2.03,
  12.97, 0.47, 23.13, -6.62, 45.02, 9.06, 20.89, -9.34, 22.80, 6.56,
  11.81, 8.50, 7.39, -11.36, -17.37, -26.47, 37.20, 23.84, -7.18, 6.56,
  18.44, 32.42, -4.91, 21.41, 22.51, 6.27, 32.12, 18.52, 5.23, 16.54,
  31.48, -3.06, 30.23, 7.49, 9.97, 1.31, 37.20, 22.68, 33.10, 28.34,
  21.04, -9.03, -11.85, -21.97, 28.36, 10.74, 4.83, 15.61, 5.48, -36.55,
  25.94, 14.82, 2.10, 15.89, 32.15, 13.48, 1.38, 12.38, 0.00, 13.28,
  21.83, -4.23, 31.21, 18.01, -18.11, 28.41, 10.14, -19.44, 26.29, 19.59
];

export function getRandomHistoricalReturns(numYears) {
  // Returns an array of random annual returns (as decimals)
  return Array.from({ length: numYears }, () =>
    historicalReturns[Math.floor(Math.random() * historicalReturns.length)] / 100
  );
}

export function projectSavings({
  currentAge, retirementAge, currentSavings, currentIncome, annualContribution, preRetirementSpending, spendingIncrease, expectedReturn
}) {
  // Returns array of savings by year
  const years = retirementAge - currentAge;
  let savings = [currentSavings];
  let spending = preRetirementSpending;
  for (let i = 0; i < years; i++) {
    const availableForSavings = currentIncome - spending;
    const totalContribution = Math.max(0, availableForSavings) + annualContribution;
    let newBalance = savings[savings.length - 1] * (1 + expectedReturn / 100) + totalContribution;
    if (availableForSavings < 0) newBalance += availableForSavings;
    savings.push(newBalance);
    spending *= 1 + spendingIncrease / 100;
  }
  return savings;
}

export function monteCarloSimulation({
  savingsAtRetirement, retirementYears, retirementSpending, totalRetirementIncome, equityAllocation, bondReturn, numSimulations, randomReturns, inflationRate = 0
}) {
  // Returns {finalBalances, successRate}
  const finalBalances = [];
  let successCount = 0;
  for (let sim = 0; sim < numSimulations; sim++) {
    let balance = savingsAtRetirement;
    let spending = retirementSpending;
    let income = totalRetirementIncome;
    let success = true;
    // Use provided randomReturns if available
    const returns = randomReturns ? randomReturns[sim] : getRandomHistoricalReturns(retirementYears);
    for (let year = 0; year < retirementYears; year++) {
      const stockReturn = returns[year];
      const portfolioReturn = stockReturn * (equityAllocation / 100) + (bondReturn / 100) * (1 - equityAllocation / 100);
      const withdrawal = Math.max(0, spending - income);
      balance = balance * (1 + portfolioReturn) - withdrawal;
      // Adjust only spending for inflation
      spending *= 1 + inflationRate / 100;
      // income remains fixed
      if (balance <= 0) {
        success = false;
        break;
      }
    }
    finalBalances.push(balance);
    if (success) successCount++;
  }
  return {
    finalBalances,
    successRate: (successCount / numSimulations) * 100
  };
}

export function fourPercentRule({
  savingsAtRetirement, retirementYears, withdrawalPercent = 4, growthRate = 5
}) {
  // Returns {balances, tableData}
  let balance = savingsAtRetirement;
  const withdrawal = savingsAtRetirement * (withdrawalPercent / 100);
  const balances = [];
  const tableData = [];
  for (let i = 0; i < retirementYears; i++) {
    balances.push(balance);
    tableData.push({
      year: i + 1,
      startBalance: balance,
      withdrawal,
      endBalance: balance * (1 + growthRate / 100) - withdrawal
    });
    balance = balance * (1 + growthRate / 100) - withdrawal;
    if (balance < 0) break;
  }
  return { balances, tableData };
}

export function retirementIncomeBreakdown({
  savingsAtRetirement, cpp1, cpp2, oas1, oas2, pension1, pension2
}) {
  // Returns income sources and total
  // Remove investment income from base calculation
  return {
    sources: [
      { label: 'CPP (Partner 1)', value: cpp1 },
      { label: 'CPP (Partner 2)', value: cpp2 },
      { label: 'OAS (Partner 1)', value: oas1 },
      { label: 'OAS (Partner 2)', value: oas2 },
      { label: 'Pension (Partner 1)', value: pension1 },
      { label: 'Pension (Partner 2)', value: pension2 }
    ],
    total: cpp1 + cpp2 + oas1 + oas2 + pension1 + pension2
  };
}