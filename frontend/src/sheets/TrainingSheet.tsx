import { useSpotterStore } from '../store/spotter';
import { Sheet } from '../motion/Sheet';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { api } from '../net/api';

export function TrainingSheet() {
  const { trainingSheetOpen, setTrainingSheetOpen, training } = useSpotterStore();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'catalog'>('queue');

  useEffect(() => {
    if (trainingSheetOpen) {
      api.getTrainingCatalog().then(data => {
        console.log('Catalog loaded:', data);
        setCatalog(data as any[]);
      }).catch(err => console.error('Catalog fetch failed:', err));
    }
  }, [trainingSheetOpen]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: 'var(--sp-2)', textAlign: 'center', cursor: 'pointer',
    background: active ? 'var(--cat-yellow-dim)' : 'var(--surface-2)',
    color: active ? 'var(--cat-yellow)' : 'var(--muted)',
    border: 'none', borderBottom: active ? '2px solid var(--cat-yellow)' : '2px solid transparent',
    fontWeight: active ? 700 : 400, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-display)',
    textTransform: 'uppercase', letterSpacing: '0.05em'
  });

  return (
    <Sheet isOpen={trainingSheetOpen} onClose={() => setTrainingSheetOpen(false)} title="Training Center">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button style={tabStyle(activeTab === 'queue')} onClick={() => setActiveTab('queue')}>My Queue ({training.length})</button>
          <button style={tabStyle(activeTab === 'catalog')} onClick={() => setActiveTab('catalog')}>Course Catalog</button>
        </div>

        {activeTab === 'queue' && (
          <>
            {training.length === 0 && (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 'var(--sp-6)' }}>No training modules queued. Great job staying on track!</p>
            )}
            {training.map((t, idx) => (
              <motion.div layout key={t.id || idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  background: 'var(--surface-2)', padding: 'var(--sp-4)',
                  borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--cat-yellow)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>{t.title}</h4>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    background: t.status === 'completed' ? 'var(--ok-dim)' : 'var(--cat-yellow-dim)',
                    color: t.status === 'completed' ? 'var(--ok)' : 'var(--cat-yellow)',
                    textTransform: 'uppercase', fontWeight: 700
                  }}>{t.status}</span>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 'var(--sp-1)' }}>{t.reason}</p>
                {t.status !== 'completed' && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => api.completeTraining(t.id)}
                    style={{
                      marginTop: 'var(--sp-3)', padding: 'var(--sp-2) var(--sp-4)',
                      background: 'var(--cat-yellow)', color: '#000', border: 'none',
                      borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-xs)'
                    }}
                  >Mark Complete</motion.button>
                )}
              </motion.div>
            ))}
          </>
        )}

        {activeTab === 'catalog' && (
          <>
            {catalog.length === 0 && <p style={{ color: 'var(--muted)' }}>Loading catalog...</p>}
            {catalog.map((c: any, idx: number) => (
              <motion.div key={c.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  background: 'var(--surface-2)', padding: 'var(--sp-4)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <h4 style={{ margin: 0, color: 'var(--text)' }}>{c.title || c.name}</h4>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 'var(--sp-1) 0' }}>
                  {c.description || `Duration: ${c.duration_min || 15} min`}
                </p>
                {c.quiz && <span style={{ fontSize: 10, color: 'var(--info)' }}>📝 Includes quiz</span>}
              </motion.div>
            ))}
          </>
        )}
      </div>
    </Sheet>
  );
}
