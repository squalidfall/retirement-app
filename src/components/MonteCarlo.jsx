import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { monteCarloSimulation, getRandomHistoricalReturns } from '../utils/calculations';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Helper to bin final balances for histogram
function getHistogramData(finalBalances, binCount = 30) {
  if (!finalBalances.length) return { bins: [], counts: [] };
  const min = Math.min(...finalBalances);
  const max = Math.max(...finalBalances);
  const binSize = (max - min) / binCount || 1;
  const bins = Array.from({ length: binCount }, (_, i) => min + i * binSize);
  const counts = Array(binCount).fill(0);
  finalBalances.forEach(val => {
    let idx = Math.floor((val - min) / binSize);
    if (idx >= binCount) idx = binCount - 1;
    counts[idx]++;
  });
  return { bins, counts };
}

export default function MonteCarlo({ inputs }) {
  const [results, setResults] = useState(null);
  // Comparison sliders
  const [adjSavings, setAdjSavings] = useState();
  const [adjSpending, setAdjSpending] = useState();

  // Generate deterministic random returns for both original and adjusted
  const [randomReturns, setRandomReturns] = useState([]);
  useEffect(() => {
    if (!inputs) return;
    const retirementAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const retirementYears = inputs.lifeExpectancy - retirementAge;
    // Pre-generate all random return sequences for all simulations
    const returnsArr = Array.from({ length: inputs.numSimulations }, () => getRandomHistoricalReturns(retirementYears));
    setRandomReturns(returnsArr);
  }, [inputs]);

  useEffect(() => {
    if (!inputs) return;
    setAdjSavings(inputs.currentSavings);
    setAdjSpending(inputs.retirementSpending);
  }, [inputs?.currentSavings, inputs?.retirementSpending]);

  useEffect(() => {
    if (!inputs || !randomReturns.length) return;
    const retirementAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const yearsToRetirement = retirementAge - Math.min(inputs.currentAge1, inputs.currentAge2);
    const retirementYears = inputs.lifeExpectancy - retirementAge;
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
    // Estimate total retirement income (simplified)
    const totalRetirementIncome = (inputs.definedPension1 + inputs.definedPension2) + (savingsAtRetirement * 0.04);
    const sim = monteCarloSimulation({
      savingsAtRetirement,
      retirementYears,
      retirementSpending: inputs.retirementSpending,
      totalRetirementIncome,
      equityAllocation: inputs.equityAllocation,
      bondReturn: inputs.bondReturn,
      numSimulations: inputs.numSimulations,
      randomReturns
    });
    setResults({
      orig: sim,
      savingsAtRetirement,
      retirementYears,
      totalRetirementIncome
    });
  }, [inputs, randomReturns]);

  useEffect(() => {
    if (!inputs || !results) return;
    setAdjSavings(results.savingsAtRetirement);
    setAdjSpending(inputs.retirementSpending);
  }, [results, inputs?.retirementSpending]);

  // Adjusted simulation
  const adjusted = React.useMemo(() => {
    if (!results || adjSavings == null || adjSpending == null || !randomReturns.length) return null;
    return monteCarloSimulation({
      savingsAtRetirement: adjSavings,
      retirementYears: results.retirementYears,
      retirementSpending: adjSpending,
      totalRetirementIncome:
        (inputs.definedPension1 + inputs.definedPension2) + (adjSavings * 0.04),
      equityAllocation: inputs.equityAllocation,
      bondReturn: inputs.bondReturn,
      numSimulations: inputs.numSimulations,
      randomReturns
    });
  }, [results, adjSavings, adjSpending, inputs, randomReturns]);

  if (!inputs || !results) return null;

  const { orig } = results;
  // Histogram data for original and adjusted
  const origHist = getHistogramData(orig.finalBalances);
  const adjHist = adjusted ? getHistogramData(adjusted.finalBalances) : null;
  const origData = {
    labels: origHist.bins.map(x => `$${Math.round(x).toLocaleString()}`),
    datasets: [
      {
        label: 'Simulation Count',
        data: origHist.counts,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };
  const adjData = adjHist && {
    labels: adjHist.bins.map(x => `$${Math.round(x).toLocaleString()}`),
    datasets: [
      {
        label: 'Simulation Count',
        data: adjHist.counts,
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
      },
    ],
  };

  return (
    <section className="monte-carlo">
      <h2>Monte Carlo Simulation</h2>
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3>Original</h3>
          <div style={{ fontSize: 14, marginBottom: 12, background: '#23272f', padding: 12, borderRadius: 6, border: '1px solid #333' }}>
            <strong>Parameters:</strong>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Equity Allocation: {inputs.equityAllocation}%</li>
              <li>Bond Return: {inputs.bondReturn}%</li>
              <li>Number of Simulations: {inputs.numSimulations}</li>
              <li>Current Savings: ${inputs.currentSavings.toLocaleString()}</li>
              <li>Retirement Spending: ${inputs.retirementSpending.toLocaleString()}</li>
              <li>Spending Increase: {inputs.spendingIncrease}%</li>
              <li>Starting Retirement Savings: ${results.savingsAtRetirement.toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
              <li>Starting Retirement Income: ${(results.totalRetirementIncome).toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
            </ul>
          </div>
          <p>Success Rate: <strong>{orig.successRate.toFixed(1)}%</strong></p>
          <p>Average Final Balance: ${
            (orig.finalBalances.reduce((a, b) => a + b, 0) / orig.finalBalances.length).toLocaleString(undefined, { maximumFractionDigits: 0 })
          }</p>
          <p>Median Final Balance: ${
            orig.finalBalances.slice().sort((a, b) => a - b)[Math.floor(orig.finalBalances.length / 2)].toLocaleString(undefined, { maximumFractionDigits: 0 })
          }</p>
          <p>10th Percentile: ${
            quantile(orig.finalBalances, 0.1).toLocaleString(undefined, { maximumFractionDigits: 0 })
          }</p>
          <p>90th Percentile: ${
            quantile(orig.finalBalances, 0.9).toLocaleString(undefined, { maximumFractionDigits: 0 })
          }</p>
          <Bar data={origData} options={{
            responsive: true,
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Distribution of Final Retirement Balances' }
            },
            scales: {
              x: { title: { display: true, text: 'Final Balance' } },
              y: { title: { display: true, text: 'Count of Simulations' } }
            }
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3>Adjusted</h3>
          <div style={{ fontSize: 14, marginBottom: 12, background: '#23272f', padding: 12, borderRadius: 6, border: '1px solid #333' }}>
            <strong>Parameters:</strong>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Equity Allocation: {inputs.equityAllocation}%</li>
              <li>Bond Return: {inputs.bondReturn}%</li>
              <li>Number of Simulations: {inputs.numSimulations}</li>
              <li>Current Savings: ${adjSavings?.toLocaleString()}</li>
              <li>Retirement Spending: ${adjSpending?.toLocaleString()}</li>
              <li>Spending Increase: {inputs.spendingIncrease}%</li>
              <li>Starting Retirement Savings: ${results.savingsAtRetirement.toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
              <li>Starting Retirement Income: ${(results.totalRetirementIncome).toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
            </ul>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
            <span style={{ minWidth: 170, display: 'inline-block' }}>Starting Retirement Savings ($):</span>
            <input type="number" min={0} max={2000000} step={5000} value={adjSavings ?? ''} onChange={e => setAdjSavings(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
            <span style={{ minWidth: 170, display: 'inline-block' }}>Retirement Spending ($):</span>
            <input type="number" min={0} max={150000} step={1000} value={adjSpending ?? ''} onChange={e => setAdjSpending(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
          </label>
          {adjusted && <>
            <p>Success Rate: <strong>{adjusted.successRate.toFixed(1)}%</strong></p>
            <p>Average Final Balance: ${
              (adjusted.finalBalances.reduce((a, b) => a + b, 0) / adjusted.finalBalances.length).toLocaleString(undefined, { maximumFractionDigits: 0 })
            }</p>
            <p>Median Final Balance: ${
              adjusted.finalBalances.slice().sort((a, b) => a - b)[Math.floor(adjusted.finalBalances.length / 2)].toLocaleString(undefined, { maximumFractionDigits: 0 })
            }</p>
            <p>10th Percentile: ${
              quantile(adjusted.finalBalances, 0.1).toLocaleString(undefined, { maximumFractionDigits: 0 })
            }</p>
            <p>90th Percentile: ${
              quantile(adjusted.finalBalances, 0.9).toLocaleString(undefined, { maximumFractionDigits: 0 })
            }</p>
            <Bar data={adjData} options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: true, text: 'Distribution of Final Retirement Balances (Adjusted)' }
              },
              scales: {
                x: { title: { display: true, text: 'Final Balance' } },
                y: { title: { display: true, text: 'Count of Simulations' } }
              }
            }} />
          </>}
        </div>
      </div>
    </section>
  );
}

// Helper function for percentiles
function quantile(arr, q) {
  if (!arr.length) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  } else {
    return sorted[base];
  }
}
