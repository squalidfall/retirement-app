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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: '#181a1b' }}>
      {/* Toggle button always visible at top left of sidebar area */}
      <button
        onClick={() => setSidebarOpen((open) => !open)}
        style={{
          position: 'fixed',
          top: 24,
          left: sidebarOpen ? 900 : 0,
          zIndex: 2000,
          background: '#181a1b',
          color: '#f3f3f3',
          border: '1px solid #333',
          borderRadius: '6px',
          width: 32,
          height: 48,
          cursor: 'pointer',
          boxShadow: '2px 0 6px #0002',
          outline: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'left 0.3s',
        }}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? '<' : '>'}
      </button>
      <aside
        style={{
          width: sidebarOpen ? 900 : 0,
          minWidth: sidebarOpen ? 700 : 0,
          transition: 'width 0.3s, min-width 0.3s',
          overflow: 'hidden',
          background: '#23272f',
          color: '#f3f3f3',
          padding: sidebarOpen ? 24 : 0,
          borderRight: sidebarOpen ? '1px solid #23272f' : 'none',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {sidebarOpen && <Sidebar onChange={setInputs} />}
      </aside>
      <main
        style={{
          flex: 1,
          padding: 32,
          maxWidth: 1200,
          margin: '0 auto',
          background: '#23272f',
          color: '#f3f3f3',
          transition: 'margin 0.3s',
        }}
      >
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
