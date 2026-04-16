import React from 'react';
import { useApp } from './context/AppContext';
import Nav from './components/Nav';
import DemoBadge from './components/DemoBadge';
import Onboarding from './screens/Onboarding';
import MyPolicy from './screens/MyPolicy';
import ManualClaim from './screens/ManualClaim';
import DisruptionMonitor from './screens/DisruptionMonitor';
import WorkerDashboard from './screens/WorkerDashboard';
import InsurerDashboard from './screens/InsurerDashboard';

function App() {
  const { state } = useApp();

  const renderScreen = () => {
    switch (state.currentTab) {
      case 'onboarding': return <Onboarding />;
      case 'policy': return state.worker ? <MyPolicy /> : <Onboarding />;
      case 'manual-claim': return state.worker ? <ManualClaim /> : <Onboarding />;
      case 'monitor': return state.worker ? <DisruptionMonitor /> : <Onboarding />;
      case 'dashboard': return state.worker ? <WorkerDashboard /> : <Onboarding />;
      case 'admin': return <InsurerDashboard />;
      default: return <Onboarding />;
    }
  };

  return (
    <>
      <Nav />
      <main className="main-content">
        {renderScreen()}
      </main>
      <DemoBadge />
    </>
  );
}

export default App;
