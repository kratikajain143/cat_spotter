import { useEffect, useState } from 'react';
import { useSpotterStore } from './store/spotter';
import { SpotterSocket } from './net/socket';
import { Boot } from './components/Boot';
import { TopBar } from './components/TopBar';
import { ActiveTaskHero } from './components/ActiveTaskHero';
import { SafetyCard } from './components/SafetyCard';
import { IdleCostMeter } from './components/IdleCostMeter';
import { TaskRail } from './components/TaskRail';
import { SpotterOrb } from './components/SpotterOrb';
import { NudgeBubble } from './components/NudgeBubble';
import { AlertTakeover } from './components/AlertTakeover';
import { Toasts } from './components/Toasts';
import { TrainingSheet } from './sheets/TrainingSheet';
import { IncidentSheet } from './sheets/IncidentSheet';
import { InsightsSheet } from './sheets/InsightsSheet';
import { EndOfShiftSummary } from './components/EndOfShiftSummary';
import { ActionBar } from './components/ActionBar';
import { ScheduleSheet } from './sheets/ScheduleSheet';

export function App() {
  const [booted, setBooted] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  
  const setConnection = useSpotterStore(state => state.setConnection);
  const handleWsMessage = useSpotterStore(state => state.handleWsMessage);

  useEffect(() => {
    const socket = new SpotterSocket(
      (msg) => handleWsMessage(msg),
      (status) => setConnection(status)
    );
    socket.connect();
    
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      const key = e.key.toLowerCase();
      if (key === 't') useSpotterStore.getState().setTrainingSheetOpen(true);
      if (key === 'i') useSpotterStore.getState().setIncidentSheetOpen(true);
      if (key === 'g') useSpotterStore.getState().setInsightsSheetOpen(true);
      if (key === 'e') useSpotterStore.getState().setEndOfShiftOpen(true);
      if (key === 's') setScheduleOpen(true);
      if (key === 'escape') {
        const s = useSpotterStore.getState();
        s.setTrainingSheetOpen(false);
        s.setIncidentSheetOpen(false);
        s.setInsightsSheetOpen(false);
        s.setEndOfShiftOpen(false);
        setScheduleOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    
    return () => {
      socket.disconnect();
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  if (!booted) {
    return <Boot onComplete={() => setBooted(true)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar />
      
      <main style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr',
        gridTemplateRows: '1fr auto',
        gap: 'var(--sp-4)',
        padding: 'var(--sp-4)',
        overflow: 'hidden',
        minHeight: 0
      }}>
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
          <ActiveTaskHero />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)', overflowY: 'auto' }}>
          <SafetyCard />
          <IdleCostMeter />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <TaskRail />
        </div>
      </main>
      
      <ActionBar onSchedule={() => setScheduleOpen(true)} />
      
      <SpotterOrb />
      <NudgeBubble />
      <AlertTakeover />
      <Toasts />
      
      <TrainingSheet />
      <IncidentSheet />
      <InsightsSheet />
      <EndOfShiftSummary />
      <ScheduleSheet isOpen={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </div>
  );
}
