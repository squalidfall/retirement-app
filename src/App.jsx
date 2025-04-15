import React, { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import Sidebar from './components/Sidebar';
import SavingsGrowth from './components/SavingsGrowth';
import MonteCarlo from './components/MonteCarlo';
import FourPercentRule from './components/FourPercentRule';
import RetirementIncome from './components/RetirementIncome';
import Footer from './components/Footer';

function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={{ marginBottom: 32, background: 'rgba(30,32,36,0.9)', borderRadius: 8, boxShadow: '0 2px 8px #0002' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          color: '#f3f3f3',
          fontSize: 22,
          fontWeight: 600,
          padding: '18px 12px',
          cursor: 'pointer',
          outline: 'none',
          borderBottom: '1px solid #333',
          borderRadius: '8px 8px 0 0',
        }}
        aria-expanded={open}
      >
        {open ? '▼' : '▶'} {title}
      </button>
      {open && <div style={{ padding: 24 }}>{children}</div>}
    </section>
  );
}

function App() {
  const [inputs, setInputs] = useState(null);

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: '#181a1b' }}>
      <aside style={{ width: 600, minWidth: 440, background: '#23272f', color: '#f3f3f3', padding: 24, borderRight: '1px solid #23272f' }}>
        <Sidebar onChange={setInputs} />
      </aside>
      <main style={{ flex: 1, padding: 32, maxWidth: 1200, margin: '0 auto', background: '#23272f', color: '#f3f3f3' }}>
        <CollapsibleSection title="Savings Growth">
          <SavingsGrowth inputs={inputs} />
        </CollapsibleSection>
        <CollapsibleSection title="Monte Carlo Simulation">
          <MonteCarlo inputs={inputs} />
        </CollapsibleSection>
        <CollapsibleSection title="4% Rule Outcome">
          <FourPercentRule inputs={inputs} />
        </CollapsibleSection>
        <CollapsibleSection title="Retirement Income Breakdown">
          <RetirementIncome inputs={inputs} />
        </CollapsibleSection>
        <Footer />
      </main>
    </div>
  );
}

export default App;
