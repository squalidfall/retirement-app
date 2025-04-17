import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { projectSavings } from '../utils/calculations';
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

export default function SavingsGrowth({ inputs }) {
  const [savings, setSavings] = useState([]);
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    if (!inputs) return;
    const projected = projectSavings({
      currentAge: Math.min(inputs.currentAge1, inputs.currentAge2),
      retirementAge: Math.max(inputs.retirementAge1, inputs.retirementAge2),
      currentSavings: inputs.currentSavings,
      currentIncome: inputs.currentIncome1 + inputs.currentIncome2,
      annualContribution: inputs.annualContribution,
      preRetirementSpending: inputs.preRetirementSpending,
      spendingIncrease: inputs.spendingIncrease,
      expectedReturn: inputs.expectedReturn // Use user input
    });
    setSavings(projected);
  }, [inputs]);

  if (!inputs) return null;

  const ages1 = Array.from({ length: savings.length }, (_, i) => inputs.currentAge1 + i);
  const ages2 = Array.from({ length: savings.length }, (_, i) => inputs.currentAge2 + i);
  const data = {
    labels: Array.from({ length: savings.length }, (_, i) => Math.min(inputs.currentAge1, inputs.currentAge2) + i),
    datasets: [
      {
        label: 'Projected Savings',
        data: savings,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

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
        <div style={{ minWidth: 400, flex: 1 }}>
          <Line data={data} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Projected Retirement Savings' } } }} />
        </div>
        <div style={{ minWidth: 260, flex: 1 }}>
          <table>
            <thead>
              <tr><th>Age (Partner 1)</th><th>Age (Partner 2)</th><th>Savings</th></tr>
            </thead>
            <tbody>
              {savings.map((s, i) => (
                <tr key={i}>
                  <td>{ages1[i]}</td>
                  <td>{ages2[i]}</td>
                  <td>${s.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}