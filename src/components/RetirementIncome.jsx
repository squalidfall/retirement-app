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
  const [showDescription, setShowDescription] = useState(false);
  const [withdrawPercent, setWithdrawPercent] = useState(0);
  const [investmentIncome, setInvestmentIncome] = useState(0);
  const [totalWithInvestments, setTotalWithInvestments] = useState(0);
  const [projectedSavingsAtRetirement, setProjectedSavingsAtRetirement] = useState(0);

  // Expose totalWithInvestments to parent via callback if provided
  useEffect(() => {
    if (typeof window !== 'undefined' && window.setMonteCarloRetirementIncome) {
      window.setMonteCarloRetirementIncome(totalWithInvestments);
    }
  }, [totalWithInvestments]);

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

  useEffect(() => {
    if (!inputs || !income) return;
    // Use projected savings at retirement for investment income calculation
    const retirementAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const yearsToRetirement = retirementAge - Math.min(inputs.currentAge1, inputs.currentAge2);
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
    const invIncome = savingsAtRetirement * (withdrawPercent / 100);
    setInvestmentIncome(invIncome);
    setTotalWithInvestments(income.total + invIncome);
    setProjectedSavingsAtRetirement(savingsAtRetirement);
  }, [inputs, income, withdrawPercent]);

  // Store the user-specified total annual retirement income (with investments) on the window for Monte Carlo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.monteCarloRetirementIncome = totalWithInvestments;
      // Dispatch a custom event to notify MonteCarlo of the change
      window.dispatchEvent(new Event('monteCarloRetirementIncomeChanged'));
    }
  }, [totalWithInvestments]);

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
        {showDescription ? 'Hide' : 'What does this show?'}
      </button>
      {showDescription && (
        <div style={{ background: '#23272f', color: '#e0e0e0', borderRadius: 6, padding: 16, marginBottom: 16, fontSize: 15, maxWidth: 700 }}>
          <strong>Retirement Income Breakdown</strong> shows the sources of your annual income in retirement, including government benefits, pensions, and investment withdrawals.<br /><br />
          <strong>How this works:</strong><br />
          - We estimate your annual income from CPP, OAS, defined benefit pensions, and a 4% withdrawal from your retirement savings.<br />
          - The pie chart visualizes the proportion of each income source.<br />
          - The table lists the dollar amount from each source and your total annual income.<br /><br />
          <strong>Parameters used:</strong>
          <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
            <li><strong>CPP & OAS:</strong> Estimated government benefits based on your input.</li>
            <li><strong>Defined Benefit Pensions:</strong> Annual pension income for each partner.</li>
            <li><strong>Investment Income:</strong> 4% withdrawal from your projected retirement savings.</li>
            <li><strong>Retirement Savings:</strong> Your projected savings at retirement.</li>
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ minWidth: 400, minHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Pie
            data={data}
            options={{
              responsive: false,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'right' } },
            }}
            width={700}
            height={700}
          />
        </div>
        <div style={{ minWidth: 260, flex: 1 }}>
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
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 15, color: '#b0b0b0', marginBottom: 6 }}>
              <strong>Starting Investment Balance: ${projectedSavingsAtRetirement.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
              Withdraw <input type="number" min={0} max={10} step={0.1} value={withdrawPercent} onChange={e => setWithdrawPercent(Number(e.target.value))} style={{ width: 70, fontSize: 16, padding: '4px 8px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', marginLeft: 4, marginRight: 4 }} />%
              of investments per year
            </label>
            <div style={{ marginTop: 8, fontSize: 15, color: '#b0b0b0' }}>
              Investment Income: <strong>${investmentIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </div>
            <div style={{ marginTop: 4, fontSize: 16 }}>
              <strong>Total Annual Income (with investments): ${totalWithInvestments.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
