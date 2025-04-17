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
      <h2>Savings Growth</h2>
      <Line data={data} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Projected Retirement Savings' } } }} />
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
    </section>
  );
}