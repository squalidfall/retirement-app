import React, { useEffect, useState } from 'react';
import { projectSavings } from '../utils/calculations';
import { Line } from 'react-chartjs-2';

export default function SavingsGrowth({ inputs }) {
  const [savings, setSavings] = useState([]);
  const [showDescription, setShowDescription] = useState(false);
  const [savingsTo65, setSavingsTo65] = useState([]);
  const [savingsChangeRetirement, setSavingsChangeRetirement] = useState([]);

  useEffect(() => {
    if (!inputs) return;
    // Project savings for each partner
    const projected1 = projectSavings({
      currentAge: inputs.currentAge1,
      retirementAge: inputs.retirementAge1,
      currentSavings: inputs.currentSavings1,
      currentIncome: inputs.currentIncome1,
      annualContribution: 0, // Remove explicit contribution
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    const projected2 = projectSavings({
      currentAge: inputs.currentAge2,
      retirementAge: inputs.retirementAge2,
      currentSavings: inputs.currentSavings2,
      currentIncome: inputs.currentIncome2,
      annualContribution: 0, // Remove explicit contribution
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    // Sum both partners' savings for each year (align lengths)
    const maxLen = Math.max(projected1.length, projected2.length);
    const combined = Array.from({ length: maxLen }, (_, i) =>
      (projected1[i] || projected1[projected1.length - 1] || 0) +
      (projected2[i] || projected2[projected2.length - 1] || 0)
    );
    setSavings(combined);
  }, [inputs]);

  useEffect(() => {
    if (!inputs) return;
    // Project savings for each partner until age 65
    const age65 = 65;
    const years1 = Math.max(0, age65 - inputs.currentAge1);
    const years2 = Math.max(0, age65 - inputs.currentAge2);
    const projected1 = projectSavings({
      currentAge: inputs.currentAge1,
      retirementAge: age65,
      currentSavings: inputs.currentSavings1,
      currentIncome: inputs.currentIncome1,
      annualContribution: 0, // Remove explicit contribution
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    const projected2 = projectSavings({
      currentAge: inputs.currentAge2,
      retirementAge: age65,
      currentSavings: inputs.currentSavings2,
      currentIncome: inputs.currentIncome2,
      annualContribution: 0, // Remove explicit contribution
      preRetirementSpending: inputs.preRetirementSpending / 2,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn
    });
    // Sum both partners' savings for each year (align lengths)
    const maxLen = Math.max(projected1.length, projected2.length);
    const combined = Array.from({ length: maxLen }, (_, i) =>
      (projected1[i] || projected1[projected1.length - 1] || 0) +
      (projected2[i] || projected2[projected2.length - 1] || 0)
    );
    setSavingsTo65(combined);
  }, [inputs]);

  useEffect(() => {
    if (!inputs) return;
    // Use the latest/planned retirement age
    const startAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const endAge = 65;
    if (startAge >= endAge) {
      setSavingsChangeRetirement([]);
      return;
    }
    // Calculate the final total from the last row of the pre-retirement table (at the end of retirement age)
    let prevSavings = inputs.currentSavings1 + inputs.currentSavings2;
    let finalTotal = prevSavings;
    for (let i = 0; i < startAge - Math.min(inputs.currentAge1, inputs.currentAge2) + 1; i++) {
      const combinedIncome = inputs.currentIncome1 + inputs.currentIncome2;
      const spending = i === 0 ? inputs.preRetirementSpending : inputs.preRetirementSpending * Math.pow(1 + inputs.spendingIncrease / 100, i);
      const surplus = combinedIncome - spending;
      const growth = prevSavings * (inputs.expectedReturn / 100);
      finalTotal = prevSavings + growth + surplus;
      prevSavings = finalTotal;
    }
    const initialSavings = finalTotal;
    // Now project from startAge+1 to 65, tracking growth, spending, and breakdown
    const years = endAge - (startAge + 1) + 1;
    let savingsArr = [{
      total: initialSavings,
      growth: 0,
      contributions: 0,
      withdrawals: 0,
      spending: 0,
      change: 0
    }];
    let spending = inputs.retirementSpending;
    for (let i = 0; i < years; i++) {
      const prev = savingsArr[savingsArr.length - 1];
      const growth = prev.total * (inputs.expectedReturn / 100);
      const contributions = 0; // No contributions after retirement
      const withdrawals = spending; // Spending is treated as withdrawal
      const newTotal = prev.total + growth + contributions - withdrawals;
      savingsArr.push({
        total: newTotal,
        growth,
        contributions,
        withdrawals,
        spending,
        change: newTotal - prev.total
      });
      spending *= 1 + (inputs.inflationRate / 100);
    }
    setSavingsChangeRetirement(savingsArr);
  }, [inputs]);

  if (!inputs) return null;

  const ages1 = Array.from({ length: savings.length }, (_, i) => inputs.currentAge1 + i);
  const ages2 = Array.from({ length: savings.length }, (_, i) => inputs.currentAge2 + i);

  return (
    <section className="savings-growth">
      <h2>Savings Until Retirement</h2>
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
          <strong>Savings Until Retirement</strong> projects how your retirement savings will grow from today until your planned retirement age, based on your current savings, annual contributions, income, spending, and expected investment return.<br /><br />
          <strong>How this works:</strong><br />
          - Each year, your savings grow by your expected investment return.<br />
          - Your annual contributions and any surplus income (income minus spending) are added.<br />
          - Your spending is increased each year by your specified spending increase rate.<br />
          - The projection stops at your planned retirement age.<br /><br />
          <strong>Parameters used:</strong>
          <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
            <li><strong>Current Savings:</strong> Your starting retirement savings.</li>
            <li><strong>Annual Contribution:</strong> How much you add to savings each year.</li>
            <li><strong>Current Income:</strong> Your annual income before retirement.</li>
            <li><strong>Annual Spending:</strong> Your current annual spending.</li>
            <li><strong>Spending Increase (%):</strong> How much your spending grows each year before retirement (not inflation).</li>
            <li><strong>Expected Investment Return (%):</strong> The annual growth rate applied to your savings.</li>
            <li><strong>Retirement Age:</strong> The age at which the projection ends.</li>
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start', justifyContent: 'center' }}>
        <div style={{ minWidth: 260, flex: 1, overflowX: 'auto', width: '100%' }}>
          <table>
            <thead>
              <tr>
                <th>Age (Partner 1)</th>
                <th>Age (Partner 2)</th>
                <th>Savings</th>
                <th>Growth</th>
                <th>Combined Income</th>
                <th>Spending</th>
                <th>Surplus/Shortfall</th>
                <th>Final Total</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Compute rows using compounding logic, do not mutate savings array
                const rows = [];
                let prevSavings = inputs.currentSavings1 + inputs.currentSavings2;
                for (let i = 0; i < savings.length; i++) {
                  const age1 = inputs.currentAge1 + i;
                  const age2 = inputs.currentAge2 + i;
                  const combinedIncome = inputs.currentIncome1 + inputs.currentIncome2;
                  const spending = i === 0 ? inputs.preRetirementSpending : inputs.preRetirementSpending * Math.pow(1 + inputs.spendingIncrease / 100, i);
                  const surplus = combinedIncome - spending;
                  const growth = prevSavings * (inputs.expectedReturn / 100);
                  const finalTotal = prevSavings + growth + surplus;
                  rows.push(
                    <tr key={i}>
                      <td>{age1}</td>
                      <td>{age2}</td>
                      <td>${prevSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td>{`$${growth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</td>
                      <td>{`$${combinedIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</td>
                      <td>{`$${spending.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</td>
                      <td style={{ color: surplus < 0 ? 'red' : surplus > 0 ? 'green' : undefined }}>{surplus === 0 ? '-' : `$${surplus.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</td>
                      <td>${finalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  );
                  prevSavings = finalTotal;
                }
                return rows;
              })()}
            </tbody>
          </table>
        </div>
      </div>
      <h2 style={{ marginTop: 40 }}>Savings Change from Planned Retirement to Age 65</h2>
      <div style={{ minWidth: 400, maxWidth: 1100, margin: '0 auto', overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Age</th>
              <th>Savings (Start of Year)</th>
              <th>Growth</th>
              <th>Withdrawals (Spending)</th>
              <th>Change from Previous Year</th>
              <th>Total Savings (End of Year)</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Compute rows using compounding logic for post-retirement
              const rows = [];
              const startAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
              let prevSavings = (() => {
                // Calculate the final total from the last row of the pre-retirement table (at the end of retirement age)
                let ps = inputs.currentSavings1 + inputs.currentSavings2;
                let ft = ps;
                for (let i = 0; i < startAge - Math.min(inputs.currentAge1, inputs.currentAge2) + 1; i++) {
                  const combinedIncome = inputs.currentIncome1 + inputs.currentIncome2;
                  const spending = i === 0 ? inputs.preRetirementSpending : inputs.preRetirementSpending * Math.pow(1 + inputs.spendingIncrease / 100, i);
                  const surplus = combinedIncome - spending;
                  const growth = ps * (inputs.expectedReturn / 100);
                  ft = ps + growth + surplus;
                  ps = ft;
                }
                return ft;
              })();
              let spending = inputs.retirementSpending;
              const years = 65 - (startAge + 1) + 1;
              for (let i = 0; i < years; i++) {
                const age = startAge + 1 + i;
                const growth = prevSavings * (inputs.expectedReturn / 100);
                const withdrawals = spending;
                const change = growth - withdrawals;
                const endOfYear = prevSavings + growth - withdrawals;
                rows.push(
                  <tr key={i}>
                    <td>{age}</td>
                    <td>${prevSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td>${growth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td>${withdrawals.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td style={{ color: change < 0 ? 'red' : change > 0 ? 'green' : undefined }}>{change === 0 ? '-' : `$${change.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</td>
                    <td>${endOfYear.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  </tr>
                );
                prevSavings = endOfYear;
                spending *= 1 + (inputs.inflationRate / 100);
              }
              return rows;
            })()}
          </tbody>
        </table>
      </div>
      {/* Line graph for growth from current age to age 65 */}
      <div style={{ width: 900, height: 320, maxWidth: 900, minWidth: 900, margin: '32px auto 0 auto', background: '#23272f', borderRadius: 8, padding: 24, boxSizing: 'border-box' }}>
        <Line
          data={(() => {
            // Prepare data for the line graph: from min current age to 65
            const minAge = Math.min(inputs.currentAge1, inputs.currentAge2);
            const maxAge = 65;
            let prevSavings = inputs.currentSavings1 + inputs.currentSavings2;
            const balances = [prevSavings];
            const ages = [minAge];
            let age1 = inputs.currentAge1;
            let age2 = inputs.currentAge2;
            let spending = inputs.preRetirementSpending;
            // Pre-retirement: from minAge up to planned retirement age
            const startAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
            for (let age = minAge + 1; age <= startAge; age++) {
              const combinedIncome = inputs.currentIncome1 + inputs.currentIncome2;
              const surplus = combinedIncome - spending;
              const growth = prevSavings * (inputs.expectedReturn / 100);
              prevSavings = prevSavings + growth + surplus;
              balances.push(prevSavings);
              ages.push(age);
              spending *= 1 + (inputs.spendingIncrease / 100);
            }
            // Post-retirement: from startAge+1 to 65
            spending = inputs.retirementSpending;
            for (let age = startAge + 1; age <= maxAge; age++) {
              const growth = prevSavings * (inputs.expectedReturn / 100);
              prevSavings = prevSavings + growth - spending;
              balances.push(prevSavings);
              ages.push(age);
              spending *= 1 + (inputs.inflationRate / 100);
            }
            return {
              labels: ages,
              datasets: [
                {
                  label: 'Projected Savings',
                  data: balances,
                  borderColor: '#36A2EB',
                  backgroundColor: 'rgba(54,162,235,0.15)',
                  fill: true,
                  tension: 0.3,
                  pointRadius: 2,
                },
              ],
            };
          })()}
          options={{
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Projected Savings Growth (Current Age to 65)', color: '#fff', font: { size: 18 } },
              tooltip: { callbacks: { label: ctx => `$${ctx.parsed.y.toLocaleString(undefined, { maximumFractionDigits: 0 })}` } }
            },
            scales: {
              x: { title: { display: true, text: 'Age', color: '#fff' }, ticks: { color: '#fff' } },
              y: { title: { display: true, text: 'Savings', color: '#fff' }, ticks: { color: '#fff' } }
            }
          }}
          width={900}
          height={320}
        />
      </div>
    </section>
  );
}