import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { fourPercentRule, projectSavings } from '../utils/calculations';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function FourPercentRule({ inputs }) {
  // Comparison sliders
  const [adjWithdrawal, setAdjWithdrawal] = useState(4);
  const [adjGrowth, setAdjGrowth] = useState(5);
  const [result, setResult] = useState(null);
  const [adjResult, setAdjResult] = useState(null);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    if (!inputs) return;
    const retirementAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const yearsToRetirement = retirementAge - Math.min(inputs.currentAge1, inputs.currentAge2);
    const retirementYears = inputs.lifeExpectancy - retirementAge;
    // Project savings for each partner (match SavingsGrowth logic)
    const projected1 = projectSavings({
      currentAge: inputs.currentAge1,
      retirementAge: inputs.retirementAge1,
      currentSavings: inputs.currentSavings1,
      currentIncome: inputs.currentIncome1,
      annualContribution: inputs.annualContribution / 2,
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    const projected2 = projectSavings({
      currentAge: inputs.currentAge2,
      retirementAge: inputs.retirementAge2,
      currentSavings: inputs.currentSavings2,
      currentIncome: inputs.currentIncome2,
      annualContribution: inputs.annualContribution / 2,
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    const maxLen = Math.max(projected1.length, projected2.length);
    const combined = Array.from({ length: maxLen }, (_, i) =>
      (projected1[i] || projected1[projected1.length - 1] || 0) +
      (projected2[i] || projected2[projected2.length - 1] || 0)
    );
    const savingsAtRetirement = combined[combined.length - 1] || 0;
    setResult(fourPercentRule({
      savingsAtRetirement,
      retirementYears,
      withdrawalPercent: 4,
      growthRate: inputs.expectedReturn ?? 5
    }));
    setAdjWithdrawal(4);
    setAdjGrowth(inputs.expectedReturn ?? 5);
    setAdjResult(fourPercentRule({
      savingsAtRetirement,
      retirementYears,
      withdrawalPercent: 4,
      growthRate: inputs.expectedReturn ?? 5
    }));
  }, [inputs]);

  useEffect(() => {
    if (!inputs || result == null) return;
    const retirementAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const yearsToRetirement = retirementAge - Math.min(inputs.currentAge1, inputs.currentAge2);
    const retirementYears = inputs.lifeExpectancy - retirementAge;
    // Project savings for each partner (match SavingsGrowth logic)
    const projected1 = projectSavings({
      currentAge: inputs.currentAge1,
      retirementAge: inputs.retirementAge1,
      currentSavings: inputs.currentSavings1,
      currentIncome: inputs.currentIncome1,
      annualContribution: inputs.annualContribution / 2,
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    const projected2 = projectSavings({
      currentAge: inputs.currentAge2,
      retirementAge: inputs.retirementAge2,
      currentSavings: inputs.currentSavings2,
      currentIncome: inputs.currentIncome2,
      annualContribution: inputs.annualContribution / 2,
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    const maxLen = Math.max(projected1.length, projected2.length);
    const combined = Array.from({ length: maxLen }, (_, i) =>
      (projected1[i] || projected1[projected1.length - 1] || 0) +
      (projected2[i] || projected2[projected2.length - 1] || 0)
    );
    const savingsAtRetirement = combined[combined.length - 1] || 0;
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
  const ages = Array.from({ length: tableData.length }, (_, i) => Math.max(inputs.retirementAge1, inputs.retirementAge2) + i);
  const data = {
    labels: ages,
    datasets: [
      {
        label: `Portfolio Balance (4% Rule, ${inputs.expectedReturn ?? 5}% Return)`,
        data: balances,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };
  const adjAges = Array.from({ length: adjTableData.length }, (_, i) => Math.max(inputs.retirementAge1, inputs.retirementAge2) + i);
  const adjData = {
    labels: adjAges,
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
      <button
        onClick={() => setShowDescription(v => !v)}
        style={{
          background: 'none',
          border: 'none',
          color: '#36A2EB',
          fontSize: 16,
          cursor: 'pointer',
          marginBottom: 8,
          textDecoration: 'underline',
        }}
        aria-expanded={showDescription}
      >
        {showDescription ? 'Hide' : 'What is the 4% Rule?'}
      </button>
      {showDescription && (
        <div style={{ background: '#23272f', color: '#e0e0e0', borderRadius: 6, padding: 16, marginBottom: 16, fontSize: 15, maxWidth: 700 }}>
          <strong>The 4% Rule</strong> is a simple retirement rule of thumb suggesting you can withdraw 4% of your retirement savings each year (adjusted for inflation) and have a high probability your money will last 30 years.<br /><br />
          <strong>How this works in this calculator:</strong><br />
          - We project your savings at retirement, then simulate annual withdrawals of 4% (or your chosen rate) of your starting balance.<br />
          - Each year, your remaining balance grows by your expected investment return.<br />
          - The table and chart show your portfolio balance over time, and you can adjust the withdrawal rate and return to see the impact.<br />
          - This section is independent of the Retirement Income section and does not include government benefits or pensions.<br /><br />
          <strong>Parameters used:</strong>
          <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
            <li><strong>Starting Retirement Savings:</strong> Your projected savings at retirement.</li>
            <li><strong>Withdrawal Rate (%):</strong> The percent of your savings withdrawn each year.</li>
            <li><strong>Expected Investment Return (%):</strong> The annual growth rate applied to your savings.</li>
            <li><strong>Retirement Years:</strong> Number of years in retirement (life expectancy minus retirement age).</li>
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3>Original (4% Rule, {inputs.expectedReturn ?? 5}% Return)</h3>
          <Line data={data} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: `4% Rule Portfolio Balance (${inputs.expectedReturn ?? 5}% Return)` } } }} />
          <table>
            <thead>
              <tr><th>Age</th><th>Start Balance</th><th>Withdrawal</th><th>End Balance</th></tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr key={i}>
                  <td>{ages[i]}</td>
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
              <tr><th>Age</th><th>Start Balance</th><th>Withdrawal</th><th>End Balance</th></tr>
            </thead>
            <tbody>
              {adjTableData.map((row, i) => (
                <tr key={i}>
                  <td>{adjAges[i]}</td>
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
