import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { monteCarloSimulation, getRandomHistoricalReturns, projectSavings, getFinalSavingsAt65 } from '../utils/calculations';
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
function getHistogramData(finalBalances, binCount = 60) {
  if (!Array.isArray(finalBalances) || !finalBalances.length) return { bins: [], counts: [] };
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

// Helper to get the latest total annual retirement income (with investments) from window for simulation and display
function getUserTotalRetirementIncome(results) {
  if (typeof window !== 'undefined' && window.monteCarloRetirementIncome != null) {
    return window.monteCarloRetirementIncome;
  }
  return results?.totalRetirementIncome ?? 0;
}

export default function MonteCarlo({ inputs }) {
  // Defensive: if inputs is missing or incomplete, don't render
  if (!inputs || Object.values(inputs).some(v => v === undefined || v === null)) return null;
  const [results, setResults] = useState(null);
  // Comparison sliders
  const [adjSavings, setAdjSavings] = useState();
  const [adjSpending, setAdjSpending] = useState();
  const [showDescription, setShowDescription] = useState(false);
  const [randomReturns, setRandomReturns] = useState([]);
  // Move forceUpdate state to the top of the component
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showGraphDescription, setShowGraphDescription] = useState(false);
  const [showReturns, setShowReturns] = useState(false);

  // Get the latest projectedSavingsAtRetirement from window (set by RetirementIncome)
  const [displayedRetirementSavings, setDisplayedRetirementSavings] = useState(() => {
    if (typeof window !== 'undefined' && window.projectedSavingsAtRetirement != null) {
      return window.projectedSavingsAtRetirement;
    }
    return getFinalSavingsAt65(inputs);
  });

  // Listen for changes to projectedSavingsAtRetirement from RetirementIncome
  useEffect(() => {
    function handleProjectedSavingsChange() {
      if (typeof window !== 'undefined' && window.projectedSavingsAtRetirement != null) {
        setDisplayedRetirementSavings(window.projectedSavingsAtRetirement);
      }
    }
    window.addEventListener('projectedSavingsAtRetirementChanged', handleProjectedSavingsChange);
    // Initial sync
    handleProjectedSavingsChange();
    return () => {
      window.removeEventListener('projectedSavingsAtRetirementChanged', handleProjectedSavingsChange);
    };
  }, []);

  // Generate deterministic random returns for both original and adjusted
  useEffect(() => {
    if (!inputs) return;
    const retirementAge = Math.max(inputs.retirementAge1, inputs.retirementAge2);
    const retirementYears = inputs.lifeExpectancy - retirementAge;
    // Pre-generate all random return sequences for all simulations
    const returnsArr = Array.from({ length: inputs.numSimulations }, () => getRandomHistoricalReturns(retirementYears));
    setRandomReturns(returnsArr);
  }, [inputs]);

  // When results.savingsAtRetirement changes, update adjSavings to match displayedRetirementSavings
  useEffect(() => {
    if (!inputs || !results) return;
    setAdjSavings(displayedRetirementSavings);
    setAdjSpending(inputs.retirementSpending);
    // eslint-disable-next-line
  }, [results?.savingsAtRetirement, displayedRetirementSavings]);

  useEffect(() => {
    if (!inputs || !randomReturns.length) return;
    if (inputs.numSimulations == null) return;
    // Use the final total from the savings change section (end of age 65) as the starting balance for Monte Carlo
    const savingsAtRetirement = getFinalSavingsAt65(inputs);
    const retirementYears = inputs.lifeExpectancy - 65;
    // ...existing code for income and simulation...
    let userTotalRetirementIncome;
    if (typeof window !== 'undefined' && window.monteCarloRetirementIncome !== undefined && window.monteCarloRetirementIncome !== null) {
      userTotalRetirementIncome = window.monteCarloRetirementIncome;
    } else {
      // fallback to base calculation if not set
      const maxCppMonthly = 1364.60;
      const cpp1 = maxCppMonthly * (inputs.cppBenefitPercent1 / 100) * 12;
      const cpp2 = maxCppMonthly * (inputs.cppBenefitPercent2 / 100) * 12;
      const oas1 = 713.34 * 12;
      const oas2 = 713.34 * 12;
      userTotalRetirementIncome = cpp1 + cpp2 + oas1 + oas2 + inputs.definedPension1 + inputs.definedPension2;
    }
    if (!userTotalRetirementIncome || isNaN(userTotalRetirementIncome)) {
      const maxCppMonthly = 1364.60;
      const cpp1 = maxCppMonthly * (inputs.cppBenefitPercent1 / 100) * 12;
      const cpp2 = maxCppMonthly * (inputs.cppBenefitPercent2 / 100) * 12;
      const oas1 = 713.34 * 12;
      const oas2 = 713.34 * 12;
      userTotalRetirementIncome = cpp1 + cpp2 + oas1 + oas2 + inputs.definedPension1 + inputs.definedPension2;
    }
    const sim = monteCarloSimulation({
      savingsAtRetirement,
      retirementYears,
      retirementSpending: inputs.retirementSpending,
      totalRetirementIncome: userTotalRetirementIncome,
      equityAllocation: inputs.equityAllocation,
      bondReturn: inputs.bondReturn,
      numSimulations: inputs.numSimulations,
      randomReturns,
      inflationRate: inputs.inflationRate
    });
    setResults({
      orig: sim,
      savingsAtRetirement,
      retirementYears,
      totalRetirementIncome: userTotalRetirementIncome
    });
  }, [inputs, randomReturns, forceUpdate]);

  // Adjusted simulation
  const [adjEquity, setAdjEquity] = useState();
  const [adjBond, setAdjBond] = useState();
  const [adjInflation, setAdjInflation] = useState();

  useEffect(() => {
    if (!inputs) return;
    setAdjEquity(inputs.equityAllocation);
    setAdjBond(inputs.bondReturn);
    setAdjInflation(inputs.inflationRate);
  }, [inputs?.equityAllocation, inputs?.bondReturn, inputs?.inflationRate]);

  // Keep adjusted parameters in sync with their input boxes
  const adjusted = React.useMemo(() => {
    if (!results || adjSavings == null || adjSpending == null || adjEquity == null || adjBond == null || adjInflation == null || !randomReturns.length) return null;
    const userTotalRetirementIncome = getUserTotalRetirementIncome(results);
    return monteCarloSimulation({
      savingsAtRetirement: adjSavings,
      retirementYears: results.retirementYears,
      retirementSpending: adjSpending,
      totalRetirementIncome: userTotalRetirementIncome,
      equityAllocation: adjEquity,
      bondReturn: adjBond,
      numSimulations: inputs.numSimulations,
      randomReturns,
      inflationRate: adjInflation
    });
  }, [results, adjSavings, adjSpending, adjEquity, adjBond, adjInflation, inputs.numSimulations, randomReturns, forceUpdate]);

  // Ensure adjusted simulation recalculates when adjusted values change
  useEffect(() => {
    setForceUpdate(f => f + 1);
  }, [adjSavings, adjSpending, adjEquity, adjBond, adjInflation]);

  // Listen for changes to window.monteCarloRetirementIncome and force update when it changes
  useEffect(() => {
    function handleStorageChange() {
      setForceUpdate(f => f + 1);
    }
    window.addEventListener('monteCarloRetirementIncomeChanged', handleStorageChange);
    return () => {
      window.removeEventListener('monteCarloRetirementIncomeChanged', handleStorageChange);
    };
  }, []);

  // Listen for changes to window.monteCarloRetirementIncome and force recalculation of both original and adjusted simulations
  useEffect(() => {
    function handleRetirementIncomeChange() {
      // Trigger recalculation by updating a dummy state
      setForceUpdate(f => f + 1);
    }
    window.addEventListener('monteCarloRetirementIncomeChanged', handleRetirementIncomeChange);
    return () => {
      window.removeEventListener('monteCarloRetirementIncomeChanged', handleRetirementIncomeChange);
    };
  }, []);

  // Defensive: if results or orig is missing, don't render
  if (!inputs || !results || !results.orig) return null;
  const { orig } = results;
  // Defensive: If orig or adjusted is null, don't render
  if (!orig || !Array.isArray(orig.finalBalances) || !orig.finalBalances.length) return null;

  // Histogram data for original and adjusted
  const origHist = getHistogramData(orig.finalBalances);
  const adjHist = adjusted ? getHistogramData(adjusted.finalBalances) : null;
  // Defensive: If histogram data is empty, don't render charts
  if (!origHist.bins.length || !origHist.counts.length) return null;
  const origData = {
    labels: origHist.bins.map(x => {
      const rounded = Math.round(x / 1000) * 1000;
      return `$${rounded.toLocaleString()}`;
    }),
    datasets: [
      {
        label: 'Simulation Count',
        data: origHist.counts,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };
  // Defensive: If adjusted is defined but has no data, don't render adjusted chart
  const adjData = adjHist && adjHist.bins.length && adjHist.counts.length ? {
    labels: adjHist.bins.map(x => {
      const rounded = Math.round(x / 1000) * 1000;
      return `$${rounded.toLocaleString()}`;
    }),
    datasets: [
      {
        label: 'Simulation Count',
        data: adjHist.counts,
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
      },
    ],
  } : null;

  return (
    <section className="monte-carlo">
      <h2>Monte Carlo Simulation</h2>
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
        {showDescription ? 'Hide' : 'What is a Monte Carlo simulation?'}
      </button>
      {showDescription && (
        <div style={{ background: '#23272f', color: '#e0e0e0', borderRadius: 6, padding: 16, marginBottom: 16, fontSize: 15, maxWidth: 700 }}>
          <strong>Monte Carlo Simulation</strong> is a method for estimating the probability of different outcomes by running many simulations using random variables. In retirement planning, it helps you understand the range of possible future portfolio values by simulating thousands of possible market scenarios.<br /><br />
          <strong>How this calculator works:</strong><br />
          - For each simulation, we start with your projected retirement savings.<br />
          - Each year, a random investment return (based on historical stock market data) is applied to your portfolio, weighted by your chosen equity and bond allocation.<br />
          - Your specified retirement spending (increased annually by your chosen inflation rate) is subtracted, and your total annual retirement income (from the Retirement Income section, including any investment withdrawals you specify) is added.<br />
          - This process repeats for each year of retirement, and the simulation tracks whether your savings last until your life expectancy.<br /><br />
          <strong>Parameters used in this simulation:</strong>
          <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
            <li><strong>Equity Allocation (%):</strong> Portion of your portfolio in stocks.</li>
            <li><strong>Bond Return (%):</strong> Expected annual return for bonds.</li>
            <li><strong>Expected Investment Return (%):</strong> Used for pre-retirement growth projections.</li>
            <li><strong>Inflation Rate (%):</strong> Annual increase applied to retirement spending.</li>
            <li><strong>Retirement Spending ($):</strong> Your annual spending in retirement.</li>
            <li><strong>Retirement Income ($):</strong> Annual income from pensions, government benefits, and any investment withdrawals you specify.</li>
            <li><strong>Number of Simulations:</strong> How many scenarios are run to estimate the probability of success.</li>
            <li><strong>Life Expectancy:</strong> Number of years the simulation runs after retirement.</li>
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3>Original</h3>
          <div style={{ fontSize: 14, marginBottom: 12, background: '#23272f', padding: 12, borderRadius: 6, border: '1px solid #333' }}>
            <strong>Parameters:</strong>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Equity Allocation: {inputs.equityAllocation}%</li>
              <li>Bond Return: {inputs.bondReturn}%</li>
              <li>Number of Simulations: {inputs.numSimulations}</li>
              <li>Retirement Spending: ${inputs.retirementSpending.toLocaleString()}</li>
              <li>Spending Increase: {inputs.spendingIncrease}%</li>
              <li>Inflation Rate: {inputs.inflationRate}%</li>
              <li>Starting Retirement Savings: ${displayedRetirementSavings != null ? Math.round(displayedRetirementSavings).toLocaleString(undefined, { maximumFractionDigits: 0 }) : ''}</li>
              <li>Starting Retirement Income: ${(getUserTotalRetirementIncome(results)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
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
          <button
            onClick={() => setShowGraphDescription(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              color: '#36A2EB',
              fontSize: 15,
              cursor: 'pointer',
              margin: '10px 0 8px 0',
              textDecoration: 'underline',
            }}
            aria-expanded={showGraphDescription}
          >
            {showGraphDescription ? 'Hide' : 'What does this graph show?'}
          </button>
          {showGraphDescription && (
            <div style={{ fontSize: 15, marginBottom: 10, color: '#b0b0b0', background: '#23272f', padding: 12, borderRadius: 6, border: '1px solid #333' }}>
              This distribution graph shows the range of possible final retirement portfolio balances from all Monte Carlo simulations, given your inputs. Each bar represents how many simulations ended with a final balance in that range. A wider spread indicates more uncertainty; a higher bar means more simulations ended with that outcome.
            </div>
          )}
          <button
            onClick={() => setShowReturns(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              color: '#36A2EB',
              fontSize: 15,
              cursor: 'pointer',
              margin: '10px 0 8px 0',
              textDecoration: 'underline',
            }}
            aria-expanded={showReturns}
          >
            {showReturns ? 'Hide' : 'Show sequence of returns used'}
          </button>
          {showReturns && randomReturns.length > 0 && (
            <div style={{ fontSize: 15, marginBottom: 10, color: '#b0b0b0', background: '#23272f', padding: 12, borderRadius: 6, border: '1px solid #333', maxHeight: 220, overflowY: 'auto' }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Sequence of Rate of Return Used (First Simulation)</strong><br />
                <span style={{ fontSize: 13, color: '#aaa' }}>
                  This is the sequence of annual rates of return (as a percentage) randomly selected for the first Monte Carlo simulation. Each simulation uses a different sequence, reflecting the uncertainty of future market returns.
                </span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 14, wordBreak: 'break-all' }}>
                {randomReturns[0].map((r, i) => `${(r * 100).toFixed(2)}%`).join(', ')}
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 320 }}>
          <h3>Adjusted</h3>
          <div style={{ fontSize: 14, marginBottom: 12, background: '#23272f', padding: 12, borderRadius: 6, border: '1px solid #333' }}>
            <strong>Parameters:</strong>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li style={{ color: adjEquity !== inputs.equityAllocation ? (adjEquity - inputs.equityAllocation > 0 ? 'green' : 'red') : undefined }}>
                Equity Allocation: {adjEquity}%
                {adjEquity !== inputs.equityAllocation && (
                  <span style={{ color: adjEquity - inputs.equityAllocation > 0 ? 'green' : 'red', marginLeft: 6 }}>
                    ({adjEquity - inputs.equityAllocation > 0 ? '+' : ''}{adjEquity - inputs.equityAllocation}%)
                  </span>
                )}
              </li>
              <li style={{ color: adjBond !== inputs.bondReturn ? (adjBond - inputs.bondReturn > 0 ? 'green' : 'red') : undefined }}>
                Bond Return: {adjBond}%
                {adjBond !== inputs.bondReturn && (
                  <span style={{ color: adjBond - inputs.bondReturn > 0 ? 'green' : 'red', marginLeft: 6 }}>
                    ({adjBond - inputs.bondReturn > 0 ? '+' : ''}{(adjBond - inputs.bondReturn).toFixed(2)}%)
                  </span>
                )}
              </li>
              <li>Number of Simulations: {inputs.numSimulations}</li>
              <li style={{ color: adjSpending !== inputs.retirementSpending ? (adjSpending - inputs.retirementSpending > 0 ? 'red' : 'green') : undefined }}>
                Retirement Spending: ${adjSpending?.toLocaleString()}
                {adjSpending !== inputs.retirementSpending && (
                  <span style={{ color: adjSpending - inputs.retirementSpending > 0 ? 'red' : 'green', marginLeft: 6 }}>
                    ({adjSpending - inputs.retirementSpending > 0 ? '+' : ''}{(adjSpending - inputs.retirementSpending).toLocaleString()})
                  </span>
                )}
              </li>
              <li>Spending Increase: {inputs.spendingIncrease}%</li>
              <li style={{ color: adjInflation !== inputs.inflationRate ? (adjInflation - inputs.inflationRate > 0 ? 'green' : 'red') : undefined }}>
                Inflation Rate: {adjInflation}%
                {adjInflation !== inputs.inflationRate && (
                  <span style={{ color: adjInflation - inputs.inflationRate > 0 ? 'green' : 'red', marginLeft: 6 }}>
                    ({adjInflation - inputs.inflationRate > 0 ? '+' : ''}{(adjInflation - inputs.inflationRate).toFixed(2)}%)
                  </span>
                )}
              </li>
              <li style={{ color: adjSavings !== displayedRetirementSavings ? (adjSavings - displayedRetirementSavings > 0 ? 'green' : 'red') : undefined }}>
                Starting Retirement Savings: ${adjSavings != null ? Math.round(adjSavings).toLocaleString() : ''}
                {adjSavings !== displayedRetirementSavings && (
                  <span style={{ color: adjSavings - displayedRetirementSavings > 0 ? 'green' : 'red', marginLeft: 6 }}>
                    ({adjSavings - displayedRetirementSavings > 0 ? '+' : ''}{(adjSavings - displayedRetirementSavings).toLocaleString()})
                  </span>
                )}
              </li>
              <li>Starting Retirement Income: ${(getUserTotalRetirementIncome(results)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</li>
            </ul>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
            <span style={{ minWidth: 170, display: 'inline-block' }}>Starting Retirement Savings ($):</span>
            <input type="number" min={0} max={2000000} step={1000} value={adjSavings != null ? Math.round(adjSavings) : ''} onChange={e => setAdjSavings(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
            <span style={{ minWidth: 170, display: 'inline-block' }}>Retirement Spending ($):</span>
            <input type="number" min={0} max={150000} step={1000} value={adjSpending ?? ''} onChange={e => setAdjSpending(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
            <span style={{ minWidth: 170, display: 'inline-block' }}>Equity Allocation (%):</span>
            <input type="number" min={0} max={100} step={5} value={adjEquity ?? ''} onChange={e => setAdjEquity(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
            <span style={{ minWidth: 170, display: 'inline-block' }}>Bond Return (%):</span>
            <input type="number" min={0} max={10} step={0.1} value={adjBond ?? ''} onChange={e => setAdjBond(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
            <span style={{ minWidth: 170, display: 'inline-block' }}>Inflation Rate (%):</span>
            <input type="number" min={0} max={5} step={0.1} value={adjInflation ?? ''} onChange={e => setAdjInflation(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
          </label>
          {adjusted && <>
            <p>
              Success Rate: <strong style={{ color: adjusted.successRate !== orig.successRate ? (adjusted.successRate - orig.successRate > 0 ? 'green' : 'red') : undefined }}>
                {adjusted.successRate.toFixed(1)}%
                {adjusted.successRate !== orig.successRate && (
                  <span style={{ color: adjusted.successRate - orig.successRate > 0 ? 'green' : 'red', marginLeft: 6 }}>
                    ({adjusted.successRate - orig.successRate > 0 ? '+' : ''}{(adjusted.successRate - orig.successRate).toFixed(1)}%)
                  </span>
                )}
              </strong>
            </p>
            <p>
              Average Final Balance: <strong style={{ color: avgFinalBalance(adjusted) !== avgFinalBalance(orig) ? (avgFinalBalance(adjusted) - avgFinalBalance(orig) > 0 ? 'green' : 'red') : undefined }}>
                ${avgFinalBalance(adjusted).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {avgFinalBalance(adjusted) !== avgFinalBalance(orig) && (
                  <span style={{ color: avgFinalBalance(adjusted) - avgFinalBalance(orig) > 0 ? 'green' : 'red', marginLeft: 6 }}>
                    ({avgFinalBalance(adjusted) - avgFinalBalance(orig) > 0 ? '+' : ''}{(avgFinalBalance(adjusted) - avgFinalBalance(orig)).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                )}
              </strong>
            </p>
            <p>
              Median Final Balance: <strong style={{ color: medianFinalBalance(adjusted) !== medianFinalBalance(orig) ? (medianFinalBalance(adjusted) - medianFinalBalance(orig) > 0 ? 'green' : 'red') : undefined }}>
                ${medianFinalBalance(adjusted).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {medianFinalBalance(adjusted) !== medianFinalBalance(orig) && (
                  <span style={{ color: medianFinalBalance(adjusted) - medianFinalBalance(orig) > 0 ? 'green' : 'red', marginLeft: 6 }}>
                    ({medianFinalBalance(adjusted) - medianFinalBalance(orig) > 0 ? '+' : ''}{(medianFinalBalance(adjusted) - medianFinalBalance(orig)).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                )}
              </strong>
            </p>
            <p>
              10th Percentile: <strong style={{ color: quantile(adjusted.finalBalances, 0.1) !== quantile(orig.finalBalances, 0.1) ? (quantile(adjusted.finalBalances, 0.1) - quantile(orig.finalBalances, 0.1) > 0 ? 'green' : 'red') : undefined }}>
                ${quantile(adjusted.finalBalances, 0.1).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {quantile(adjusted.finalBalances, 0.1) !== quantile(orig.finalBalances, 0.1) && (
                  <span style={{ color: quantile(adjusted.finalBalances, 0.1) - quantile(orig.finalBalances, 0.1) > 0 ? 'green' : 'red', marginLeft: 6 }}>
                    ({quantile(adjusted.finalBalances, 0.1) - quantile(orig.finalBalances, 0.1) > 0 ? '+' : ''}{(quantile(adjusted.finalBalances, 0.1) - quantile(orig.finalBalances, 0.1)).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                )}
              </strong>
            </p>
            <p>
              90th Percentile: <strong style={{ color: quantile(adjusted.finalBalances, 0.9) !== quantile(orig.finalBalances, 0.9) ? (quantile(adjusted.finalBalances, 0.9) - quantile(orig.finalBalances, 0.9) > 0 ? 'green' : 'red') : undefined }}>
                ${quantile(adjusted.finalBalances, 0.9).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                {quantile(adjusted.finalBalances, 0.9) !== quantile(orig.finalBalances, 0.9) && (
                  <span style={{ color: quantile(adjusted.finalBalances, 0.9) - quantile(orig.finalBalances, 0.9) > 0 ? 'green' : 'red', marginLeft: 6 }}>
                    ({quantile(adjusted.finalBalances, 0.9) - quantile(orig.finalBalances, 0.9) > 0 ? '+' : ''}{(quantile(adjusted.finalBalances, 0.9) - quantile(orig.finalBalances, 0.9)).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                )}
              </strong>
            </p>
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
  if (!Array.isArray(arr) || !arr.length) return 0;
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

// Helper functions for results
function avgFinalBalance(sim) {
  return Math.round(sim.finalBalances.reduce((a, b) => a + b, 0) / sim.finalBalances.length);
}
function medianFinalBalance(sim) {
  const sorted = sim.finalBalances.slice().sort((a, b) => a - b);
  return Math.round(sorted[Math.floor(sorted.length / 2)]);
}
