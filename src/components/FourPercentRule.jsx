import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { fourPercentRule } from '../utils/calculations';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function FourPercentRule({ inputs }) {
  // Comparison sliders
  const [adjWithdrawal, setAdjWithdrawal] = useState(4);
  const [adjGrowth, setAdjGrowth] = useState(5);
  const [result, setResult] = useState(null);
  const [adjResult, setAdjResult] = useState(null);

  useEffect(() => {
    if (!inputs) return;
    const retirementAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const yearsToRetirement = retirementAge - Math.min(inputs.currentAge1, inputs.currentAge2);
    const retirementYears = inputs.lifeExpectancy - retirementAge;
    // Project savings at retirement
    const savingsGrowth = [inputs.currentSavings];
    let spending = inputs.preRetirementSpending;
    for (let i = 0; i < yearsToRetirement; i++) {
      const availableForSavings = inputs.currentIncome1 + inputs.currentIncome2 - spending;
      const totalContribution = Math.max(0, availableForSavings) + inputs.annualContribution;
      let newBalance = savingsGrowth[savingsGrowth.length - 1] * (1 + 0.05) + totalContribution;
      if (availableForSavings < 0) newBalance += availableForSavings;
      savingsGrowth.push(newBalance);
      spending *= 1 + inputs.spendingIncrease / 100;
    }
    const savingsAtRetirement = savingsGrowth[savingsGrowth.length - 1];
    setResult(fourPercentRule({
      savingsAtRetirement,
      retirementYears,
      withdrawalPercent: 4,
      growthRate: 5
    }));
    setAdjWithdrawal(4);
    setAdjGrowth(5);
    setAdjResult(fourPercentRule({
      savingsAtRetirement,
      retirementYears,
      withdrawalPercent: 4,
      growthRate: 5
    }));
  }, [inputs]);

  useEffect(() => {
    if (!inputs || result == null) return;
    const retirementAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const yearsToRetirement = retirementAge - Math.min(inputs.currentAge1, inputs.currentAge2);
    const retirementYears = inputs.lifeExpectancy - retirementAge;
    const savingsGrowth = [inputs.currentSavings];
    let spending = inputs.preRetirementSpending;
    for (let i = 0; i < yearsToRetirement; i++) {
      const availableForSavings = inputs.currentIncome1 + inputs.currentIncome2 - spending;
      const totalContribution = Math.max(0, availableForSavings) + inputs.annualContribution;
      let newBalance = savingsGrowth[savingsGrowth.length - 1] * (1 + 0.05) + totalContribution;
      if (availableForSavings < 0) newBalance += availableForSavings;
      savingsGrowth.push(newBalance);
      spending *= 1 + inputs.spendingIncrease / 100;
    }
    const savingsAtRetirement = savingsGrowth[savingsGrowth.length - 1];
    setAdjResult(fourPercentRule({
      savingsAtRetirement,
      retirementYears,
      withdrawalPercent: adjWithdrawal,
      growthRate: adjGrowth
    }));
  }, [adjWithdrawal, adjGrowth, inputs, result]);

  if (!inputs || !result || !adjResult) return null;

  const { balances, tableData } = result;
  const { balances: adjBalances, tableData: adjTableData } = adjResult;
  const data = {
    labels: tableData.map((row) => row.year),
    datasets: [
      {
        label: 'Portfolio Balance (4% Rule)',
        data: balances,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };
  const adjData = {
    labels: adjTableData.map((row) => row.year),
    datasets: [
      {
        label: `Portfolio Balance (${adjWithdrawal}% Rule, ${adjGrowth}% Return)`,
        data: adjBalances,
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        fill: true,
      },
    ],
  };

  return (
    <section className="four-percent-rule">
      <h2>4% Rule Outcome</h2>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3>Original (4% Rule, 5% Return)</h3>
          <Line data={data} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: '4% Rule Portfolio Balance' } } }} />
          <table>
            <thead>
              <tr><th>Year</th><th>Start Balance</th><th>Withdrawal</th><th>End Balance</th></tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i}>
                  <td>{row.year}</td>
                  <td>${row.startBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>${row.withdrawal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>${row.endBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3>Adjusted</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
            <span style={{ minWidth: 170, display: 'inline-block' }}>Withdrawal %:</span>
            <input type="number" min={2} max={8} step={0.1} value={adjWithdrawal} onChange={e => setAdjWithdrawal(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
            <span style={{ minWidth: 170, display: 'inline-block' }}>Rate of Return %:</span>
            <input type="number" min={0} max={10} step={0.1} value={adjGrowth} onChange={e => setAdjGrowth(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
          </label>
          <Line data={adjData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: `${adjWithdrawal}% Rule Portfolio Balance` } } }} />
          <table>
            <thead>
              <tr><th>Year</th><th>Start Balance</th><th>Withdrawal</th><th>End Balance</th></tr>
            </thead>
            <tbody>
              {adjTableData.map((row, i) => (
                <tr key={i}>
                  <td>{row.year}</td>
                  <td>${row.startBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>${row.withdrawal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td>${row.endBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
