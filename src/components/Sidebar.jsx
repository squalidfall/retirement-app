import React, { useState, useEffect } from 'react';

// Custom hook for localStorage-backed state
function usePersistedState(key, defaultValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

export default function Sidebar({ onChange }) {
  // Partner 1
  const [currentAge1, setCurrentAge1] = usePersistedState('currentAge1', 48);
  const [retirementAge1, setRetirementAge1] = usePersistedState('retirementAge1', 65);
  const [currentIncome1, setCurrentIncome1] = usePersistedState('currentIncome1', 75000);
  const [definedPension1, setDefinedPension1] = usePersistedState('definedPension1', 20000);
  const [cppBenefitPercent1, setCppBenefitPercent1] = usePersistedState('cppBenefitPercent1', 100);
  // Partner 2
  const [currentAge2, setCurrentAge2] = usePersistedState('currentAge2', 48);
  const [retirementAge2, setRetirementAge2] = usePersistedState('retirementAge2', 48);
  const [currentIncome2, setCurrentIncome2] = usePersistedState('currentIncome2', 15000);
  const [definedPension2, setDefinedPension2] = usePersistedState('definedPension2', 0);
  const [cppBenefitPercent2, setCppBenefitPercent2] = usePersistedState('cppBenefitPercent2', 50);
  // Shared
  const [lifeExpectancy, setLifeExpectancy] = usePersistedState('lifeExpectancy', 90);
  const [currentSavings, setCurrentSavings] = usePersistedState('currentSavings', 1000000);
  const [annualContribution, setAnnualContribution] = usePersistedState('annualContribution', 0);
  // Spending
  const [preRetirementSpending, setPreRetirementSpending] = usePersistedState('preRetirementSpending', 100000);
  const [retirementSpending, setRetirementSpending] = usePersistedState('retirementSpending', 75000);
  const [spendingIncrease, setSpendingIncrease] = usePersistedState('spendingIncrease', 2.0);
  // Investment
  const [equityAllocation, setEquityAllocation] = usePersistedState('equityAllocation', 60);
  const [bondReturn, setBondReturn] = usePersistedState('bondReturn', 3.0);
  const [inflationRate, setInflationRate] = usePersistedState('inflationRate', 2.0);
  // Monte Carlo
  const [numSimulations, setNumSimulations] = usePersistedState('numSimulations', 5000);

  // Notify parent of changes
  useEffect(() => {
    onChange && onChange({
      currentAge1, retirementAge1, currentIncome1, definedPension1, cppBenefitPercent1,
      currentAge2, retirementAge2, currentIncome2, definedPension2, cppBenefitPercent2,
      lifeExpectancy, currentSavings, annualContribution,
      preRetirementSpending, retirementSpending, spendingIncrease,
      equityAllocation, bondReturn, inflationRate, numSimulations
    });
  }, [currentAge1, retirementAge1, currentIncome1, definedPension1, cppBenefitPercent1,
      currentAge2, retirementAge2, currentIncome2, definedPension2, cppBenefitPercent2,
      lifeExpectancy, currentSavings, annualContribution,
      preRetirementSpending, retirementSpending, spendingIncrease,
      equityAllocation, bondReturn, inflationRate, numSimulations, onChange]);

  return (
    <aside className="sidebar">
      <h2>Couple's Information</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h3>Partner 1</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>Current Age:</span>
              <input type="number" min={18} max={100} value={currentAge1} onChange={e => setCurrentAge1(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>Planned Retirement Age:</span>
              <input type="number" min={currentAge1} max={100} value={retirementAge1} onChange={e => setRetirementAge1(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>Current Annual Income ($):</span>
              <input type="number" min={0} value={currentIncome1} onChange={e => setCurrentIncome1(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>Defined Pension (Annual):</span>
              <input type="number" min={0} max={100000} step={1000} value={definedPension1} onChange={e => setDefinedPension1(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>CPP Benefit (% of max):</span>
              <input type="number" min={0} max={100} step={5} value={cppBenefitPercent1} onChange={e => setCppBenefitPercent1(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <h3>Partner 2</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>Current Age:</span>
              <input type="number" min={18} max={100} value={currentAge2} onChange={e => setCurrentAge2(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>Planned Retirement Age:</span>
              <input type="number" min={currentAge2} max={100} value={retirementAge2} onChange={e => setRetirementAge2(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>Current Annual Income ($):</span>
              <input type="number" min={0} value={currentIncome2} onChange={e => setCurrentIncome2(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>Defined Pension (Annual):</span>
              <input type="number" min={0} max={100000} step={1000} value={definedPension2} onChange={e => setDefinedPension2(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 36 }}>
              <span style={{ minWidth: 170, display: 'inline-block' }}>CPP Benefit (% of max):</span>
              <input type="number" min={0} max={100} step={5} value={cppBenefitPercent2} onChange={e => setCppBenefitPercent2(Number(e.target.value))} style={{ width: '100%', minWidth: 120, maxWidth: 260, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3' }} />
            </label>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3>Shared Information</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Life Expectancy:
          <input type="number" min={Math.max(retirementAge1, retirementAge2)} max={120} value={lifeExpectancy} onChange={e => setLifeExpectancy(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Current Combined Retirement Savings ($):
          <input type="number" min={0} value={currentSavings} onChange={e => setCurrentSavings(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Annual Combined Contribution ($):
          <input type="number" min={0} value={annualContribution} onChange={e => setAnnualContribution(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3>Spending Information</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Current Annual Spending ($):
          <input type="number" min={0} value={preRetirementSpending} onChange={e => setPreRetirementSpending(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Expected Annual Retirement Spending ($):
          <input type="number" min={0} value={retirementSpending} onChange={e => setRetirementSpending(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Annual Spending Increase (%):
          <input type="number" min={0} max={5} step={0.1} value={spendingIncrease} onChange={e => setSpendingIncrease(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3>Investment Parameters</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Equity Allocation (%):
          <input type="number" min={0} max={100} step={5} value={equityAllocation} onChange={e => setEquityAllocation(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Expected Bond Return (%):
          <input type="number" min={0} max={10} step={0.5} value={bondReturn} onChange={e => setBondReturn(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Expected Inflation Rate (%):
          <input type="number" min={0} max={5} step={0.1} value={inflationRate} onChange={e => setInflationRate(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3>Monte Carlo Parameters</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          Number of Simulations:
          <input type="number" min={100} max={10000} step={100} value={numSimulations} onChange={e => setNumSimulations(Number(e.target.value))} style={{ width: 180, minWidth: 180, maxWidth: 180, fontSize: 18, padding: '6px 10px', borderRadius: 4, border: '1px solid #888', background: '#181a1b', color: '#f3f3f3', textAlign: 'right' }} />
        </label>
      </div>
    </aside>
  );
}