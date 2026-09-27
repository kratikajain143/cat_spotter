import { motion } from 'framer-motion';
import { useSpotterStore } from '../store/spotter';
import { api } from '../net/api';

const actions = [
  { key: 'S', label: 'Schedule Task', icon: '🗓️', action: 'schedule' },
  { key: 'T', label: 'Training', icon: '📚', action: 'training' },
  { key: 'I', label: 'Report Incident', icon: '⚠️', action: 'incident' },
  { key: 'G', label: 'Analytics', icon: '📊', action: 'insights' },
  { key: 'E', label: 'Shift Summary', icon: '📋', action: 'endshift' },
  { key: '▶', label: 'Start Sim', icon: '▶️', action: 'play' },
  { key: '⏸', label: 'Pause Sim', icon: '⏸️', action: 'pause' },
  { key: '🔄', label: 'Reset', icon: '🔄', action: 'reset' },
  { key: 'Space', label: 'Voice', icon: '🎤', action: 'voice' },
];

interface ActionBarProps {
  onSchedule?: () => void;
}

export function ActionBar({ onSchedule }: ActionBarProps) {
  const handleAction = async (action: string) => {
    const s = useSpotterStore.getState();
    switch (action) {
      case 'schedule': onSchedule?.(); break;
      case 'training': s.setTrainingSheetOpen(true); break;
      case 'incident': s.setIncidentSheetOpen(true); break;
      case 'insights': s.setInsightsSheetOpen(true); break;
      case 'endshift': s.setEndOfShiftOpen(true); break;
      case 'play': await api.simControl({ action: 'play' }); break;
      case 'pause': await api.simControl({ action: 'pause' }); break;
      case 'reset': await api.simControl({ action: 'reset' }); break;
    }
  };

  return (
    <div style={{
      display: 'flex', gap: 'var(--sp-2)', padding: 'var(--sp-2) var(--sp-4)',
      background: 'var(--surface)', borderTop: '1px solid var(--border)',
      overflowX: 'auto', alignItems: 'center', flexShrink: 0
    }}>
      {actions.map(a => (
        <motion.button
          key={a.label}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleAction(a.action)}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
            padding: 'var(--sp-2) var(--sp-3)',
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            color: 'var(--text)', fontSize: 'var(--text-xs)',
            whiteSpace: 'nowrap', flexShrink: 0, minHeight: 36
          }}
        >
          <span>{a.icon}</span>
          <span>{a.label}</span>
          {a.key.length === 1 && (
            <kbd style={{
              padding: '1px 5px', background: 'var(--surface-3)',
              borderRadius: 3, fontSize: 10, fontFamily: 'var(--font-mono)',
              color: 'var(--cat-yellow)', border: '1px solid var(--border-light)',
              marginLeft: 4
            }}>{a.key}</kbd>
          )}
        </motion.button>
      ))}
    </div>
  );
}
