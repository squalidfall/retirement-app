import React, { useEffect, useState } from 'react';
import { retirementIncomeBreakdown, projectSavings, getFinalSavingsAt65 } from '../utils/calculations';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

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
    // Use the final total from the savings change section (end of age 65) as the starting balance for the breakdown
    const savingsAtRetirement = getFinalSavingsAt65(inputs);
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
    setProjectedSavingsAtRetirement(savingsAtRetirement);
  }, [inputs]);

  useEffect(() => {
    if (!inputs || !income) return;
    // Use projected savings at age 65 for investment income calculation
    const startAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const age65 = 65;
    const projected1 = projectSavings({
      currentAge: inputs.currentAge1,
      retirementAge: inputs.retirementAge1,
      currentSavings: inputs.currentSavings1,
      currentIncome: inputs.currentIncome1,
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    const projected2 = projectSavings({
      currentAge: inputs.currentAge2,
      retirementAge: inputs.retirementAge2,
      currentSavings: inputs.currentSavings2,
      currentIncome: inputs.currentIncome2,
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    const years1 = startAge - inputs.currentAge1;
    const years2 = startAge - inputs.currentAge2;
    const savings1 = years1 < projected1.length ? projected1[years1] : projected1[projected1.length - 1] || 0;
    const savings2 = years2 < projected2.length ? projected2[years2] : projected2[projected2.length - 1] || 0;
    let initialSavings = savings1 + savings2;
    let savingsAt65 = initialSavings;
    let spending = inputs.retirementSpending;
    for (let i = 0; i < age65 - startAge; i++) {
      const growth = savingsAt65 * (inputs.expectedReturn / 100);
      savingsAt65 = savingsAt65 + growth - spending;
      spending *= 1 + (inputs.inflationRate / 100);
    }
    const savingsAtRetirement = savingsAt65;
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

  // Store projectedSavingsAtRetirement on window for MonteCarlo to read for display and simulation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.projectedSavingsAtRetirement = projectedSavingsAtRetirement;
      window.dispatchEvent(new Event('projectedSavingsAtRetirementChanged'));
    }
  }, [projectedSavingsAtRetirement]);

  // Persist withdrawPercent in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('withdrawPercent');
    if (stored !== null) setWithdrawPercent(Number(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem('withdrawPercent', withdrawPercent);
  }, [withdrawPercent]);

  if (!inputs || !income) return null;

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
          <strong>Retirement Income Breakdown</strong> shows the sources of your annual income in retirement, including government benefits, pensions, and any investment withdrawals you specify below.<br /><br />
          <strong>How this works:</strong><br />
          - We estimate your annual income from CPP, OAS, defined benefit pensions, and an optional withdrawal from your retirement savings (you choose the % below).<br />
          - The pie chart visualizes the proportion of each income source.<br />
          - The table lists the dollar amount from each source and your total annual income.<br />
          - You can specify a withdrawal % from your investments to see how it affects your total income.<br /><br />
          <strong>Parameters used:</strong>
          <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
            <li><strong>CPP & OAS:</strong> Estimated government benefits based on your input.</li>
            <li><strong>Defined Benefit Pensions:</strong> Annual pension income for each partner.</li>
            <li><strong>Investment Income:</strong> Optional withdrawal from your projected retirement savings (user-specified %).</li>
            <li><strong>Retirement Savings:</strong> Your projected savings at retirement.</li>
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ width: 400, height: 400, minWidth: 400, minHeight: 400, maxWidth: 400, maxHeight: 400, display: 'block', margin: '0 auto' }}>
          <Pie
            data={{
              labels: income.sources.map(s => s.label),
              datasets: [
                {
                  data: income.sources.map(s => s.value),
                  backgroundColor: [
                    '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'
                  ],
                },
              ],
            }}
            options={{
              responsive: false,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'right' } },
            }}
            width={400}
            height={400}
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
