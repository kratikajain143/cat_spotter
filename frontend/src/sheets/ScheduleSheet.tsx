import { useSpotterStore } from '../store/spotter';
import { Sheet } from '../motion/Sheet';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../net/api';

const TASK_TYPES = [
  'Trenching', 'Earth Excavation', 'Material Loading',
  'Grading', 'Demolition', 'Backfilling', 'Site Clearing', 'Compaction'
];

const SITES = [
  { value: 'A', label: 'Site A — Main Campus' },
  { value: 'B', label: 'Site B — Remote (8km)' },
  { value: 'C', label: 'Site C — Highway Extension' },
];

const TIME_SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: 'var(--sp-3)', background: 'var(--surface-3)',
  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
  color: 'var(--text)', fontSize: 'var(--text-sm)', outline: 'none',
  fontFamily: 'var(--font-body)'
};

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)', color: 'var(--muted)', textTransform: 'uppercase',
  marginBottom: 'var(--sp-1)', display: 'block', fontWeight: 600
};

interface ScheduleSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScheduleSheet({ isOpen, onClose }: ScheduleSheetProps) {
  const tasks = useSpotterStore(state => state.tasks);
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [formData, setFormData] = useState({
    task_type: '', site: 'A', planned_start: '08:00', pinned: false, notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!formData.task_type) return;
    setSubmitting(true);
    try {
      await api.scheduleTask({
        task_type: formData.task_type,
        site: formData.site,
        planned_start: formData.planned_start,
        pinned: formData.pinned,
        notes: formData.notes
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setMode('list');
        setFormData({ task_type: '', site: 'A', planned_start: '08:00', pinned: false, notes: '' });
      }, 1500);
    } catch (err) {
      console.error('Failed to schedule task', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={() => { onClose(); setMode('list'); }} title="Shift Scheduler">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
        {mode === 'list' ? (
          <>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setMode('form')}
              style={{
                padding: 'var(--sp-3)', background: 'var(--cat-yellow)', color: '#000',
                borderRadius: 'var(--radius-md)', fontWeight: 700, border: 'none',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-display)',
                letterSpacing: '0.05em', textTransform: 'uppercase'
              }}
            >
              + Schedule New Task
            </motion.button>

            <h4 style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', margin: 0 }}>
              Today's Schedule ({tasks.length} tasks)
            </h4>

            {tasks.map((task, idx) => (
              <motion.div
                key={task.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{
                  background: 'var(--surface-2)', padding: 'var(--sp-4)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `3px solid ${
                    task.status === 'active' ? 'var(--cat-yellow)' :
                    task.status === 'done' ? 'var(--ok)' : 'var(--border-light)'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text)' }}>{task.task_type}</h4>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: 2 }}>
                      Site {task.site} • {task.planned_start || 'Flexible'}
                      {task.pinned && <span style={{ color: 'var(--warn)', marginLeft: 8 }}>📌 Pinned</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      background: task.status === 'active' ? 'var(--cat-yellow-dim)' :
                                  task.status === 'done' ? 'var(--ok-dim)' : 'var(--surface-3)',
                      color: task.status === 'active' ? 'var(--cat-yellow)' :
                             task.status === 'done' ? 'var(--ok)' : 'var(--muted)',
                      textTransform: 'uppercase', fontWeight: 700
                    }}>{task.status}</span>
                    {task.status === 'queued' && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={async () => { await api.startTask(task.id); }}
                        style={{
                          padding: '2px 8px', background: 'var(--cat-yellow)', color: '#000',
                          border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          fontSize: 10, fontWeight: 700
                        }}
                      >START</motion.button>
                    )}
                    {task.status === 'active' && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={async () => { await api.completeTask(task.id); }}
                        style={{
                          padding: '2px 8px', background: 'var(--ok)', color: '#000',
                          border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          fontSize: 10, fontWeight: 700
                        }}
                      >DONE</motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: 'var(--sp-8)' }}
              >
                <div style={{ fontSize: 48, marginBottom: 'var(--sp-4)' }}>📋</div>
                <h3 style={{ color: 'var(--ok)' }}>Task Scheduled Successfully</h3>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}
              >
                <div>
                  <label style={labelStyle}>Task Type *</label>
                  <select value={formData.task_type} onChange={e => setFormData(p => ({...p, task_type: e.target.value}))} style={inputStyle}>
                    <option value="">Select task type...</option>
                    {TASK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Site *</label>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                    {SITES.map(s => (
                      <button key={s.value} onClick={() => setFormData(p => ({...p, site: s.value}))}
                        style={{
                          flex: 1, padding: 'var(--sp-2)', borderRadius: 'var(--radius-sm)',
                          border: formData.site === s.value ? '2px solid var(--cat-yellow)' : '1px solid var(--border)',
                          background: formData.site === s.value ? 'var(--cat-yellow-dim)' : 'var(--surface-3)',
                          color: formData.site === s.value ? 'var(--cat-yellow)' : 'var(--muted)',
                          cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-xs)'
                        }}
                      >{s.value}</button>
                    ))}
                  </div>
                  <p style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                    {SITES.find(s => s.value === formData.site)?.label}
                  </p>
                </div>
                <div>
                  <label style={labelStyle}>Planned Start Time</label>
                  <select value={formData.planned_start} onChange={e => setFormData(p => ({...p, planned_start: e.target.value}))} style={inputStyle}>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.pinned}
                      onChange={e => setFormData(p => ({...p, pinned: e.target.checked}))}
                      style={{ accentColor: 'var(--cat-yellow)' }} />
                    Pin this task (cannot be reordered by optimizer)
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Notes</label>
                  <textarea rows={3} placeholder="Optional notes about this task..." value={formData.notes}
                    onChange={e => setFormData(p => ({...p, notes: e.target.value}))}
                    style={{...inputStyle, resize: 'vertical'}} />
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                  <button onClick={() => setMode('list')} style={{
                    flex: 1, padding: 'var(--sp-3)', background: 'var(--surface-3)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    color: 'var(--text)', cursor: 'pointer'
                  }}>Cancel</button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting || !formData.task_type}
                    style={{
                      flex: 2, padding: 'var(--sp-3)', background: submitting ? 'var(--muted)' : 'var(--cat-yellow)',
                      color: '#000', borderRadius: 'var(--radius-md)', fontWeight: 700,
                      border: 'none', cursor: submitting ? 'wait' : 'pointer',
                      opacity: !formData.task_type ? 0.5 : 1
                    }}
                  >
                    {submitting ? 'Scheduling...' : 'Schedule Task'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </Sheet>
  );
}
