import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { retirementIncomeBreakdown } from '../utils/calculations';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RetirementIncome({ inputs }) {
  const [income, setIncome] = useState(null);

  useEffect(() => {
    if (!inputs) return;
    const retirementAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const yearsToRetirement = retirementAge - Math.min(inputs.currentAge1, inputs.currentAge2);
    // Project savings at retirement
    const savingsGrowth = [inputs.currentSavings];
    let spending = inputs.preRetirementSpending;
    for (let i = 0; i < yearsToRetirement; i++) {
      const availableForSavings = inputs.currentIncome1 + inputs.currentIncome2 - spending;
      const totalContribution = Math.max(0, availableForSavings) + inputs.annualContribution;
      let newBalance = savingsGrowth[savingsGrowth.length - 1] * (1 + (inputs.expectedReturn ?? 5) / 100) + totalContribution;
      if (availableForSavings < 0) newBalance += availableForSavings;
      savingsGrowth.push(newBalance);
      spending *= 1 + inputs.spendingIncrease / 100;
    }
    const savingsAtRetirement = savingsGrowth[savingsGrowth.length - 1];
    // Estimate government benefits (simplified, fixed max values)
    const maxCppMonthly = 1364.60;
    const cpp1 = maxCppMonthly * (inputs.cppBenefitPercent1 / 100) * 12;
    const cpp2 = maxCppMonthly * (inputs.cppBenefitPercent2 / 100) * 12;
    const oas1 = 713.34 * 12;
    const oas2 = 713.34 * 12;
    setIncome(retirementIncomeBreakdown({
      savingsAtRetirement,
      cpp1, cpp2, oas1, oas2,
      pension1: inputs.definedPension1,
      pension2: inputs.definedPension2
    }));
  }, [inputs]);

  if (!inputs || !income) return null;

  const data = {
    labels: income.sources.map(s => s.label),
    datasets: [
      {
        data: income.sources.map(s => s.value),
        backgroundColor: [
          '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
        ],
      },
    ],
  };

  return (
    <section className="retirement-income">
      <h2>Retirement Income Breakdown</h2>
      <Pie data={data} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
      <table>
        <thead>
          <tr><th>Source</th><th>Amount</th></tr>
        </thead>
        <tbody>
          {income.sources.map((s, i) => (
            <tr key={i}><td>{s.label}</td><td>${s.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td></tr>
          ))}
        </tbody>
      </table>
      <p><strong>Total Annual Income: ${income.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></p>
    </section>
  );
}
