const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  health: () => request<{ status: string; llm_mode: string; model_loaded: boolean }>('/health'),
  getState: () => request<Record<string, unknown>>('/state'),
  getTasks: () => request<unknown[]>('/tasks/today'),
  startTask: (id: string) => request<unknown>(`/tasks/${id}/start`, { method: 'POST' }),
  completeTask: (id: string) => request<unknown>(`/tasks/${id}/complete`, { method: 'POST' }),
  optimizeSchedule: () => request<unknown>('/schedule/optimize', { method: 'POST' }),
  getResourceForecast: () => request<unknown>('/forecast/resources'),
  estimate: (body: Record<string, unknown>) =>
    request<unknown>('/estimate', { method: 'POST', body: JSON.stringify(body) }),
  getSafetyScore: () => request<unknown>('/safety/score'),
  getIncidents: () => request<unknown[]>('/incidents'),
  createIncident: (body: Record<string, unknown>) =>
    request<unknown>('/incidents', { method: 'POST', body: JSON.stringify(body) }),
  labelIdleReason: (body: Record<string, unknown>) =>
    request<unknown>('/idle-reasons', { method: 'POST', body: JSON.stringify(body) }),
  getTrainingQueue: () => request<unknown[]>('/training/queue'),
  getTrainingCatalog: () => request<unknown[]>('/training/catalog'),
  completeTraining: (id: string) => request<unknown>(`/training/${id}/complete`, { method: 'POST' }),
  getTrainingSlots: () => request<unknown[]>('/training/slots'),
  bookTraining: (body: Record<string, unknown>) =>
    request<unknown>('/training/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getLeaderboard: () => request<unknown[]>('/leaderboard'),
  getGhost: (taskType: string) => request<unknown>(`/analytics/ghost?task_type=${encodeURIComponent(taskType)}`),
  voiceCommand: (text: string) =>
    request<unknown>('/voice/command', { method: 'POST', body: JSON.stringify({ text }) }),
  simControl: (body: Record<string, unknown>) =>
    request<unknown>('/sim/control', { method: 'POST', body: JSON.stringify(body) }),
  simInject: (body: Record<string, unknown>) =>
    request<unknown>('/sim/inject', { method: 'POST', body: JSON.stringify(body) }),
  ackAlert: (alertId: string) => request<unknown>(`/ack/${alertId}`, { method: 'POST' }),
  scheduleTask: (body: Record<string, unknown>) =>
    request<unknown>('/tasks/schedule', { method: 'POST', body: JSON.stringify(body) }),
  deleteTask: (taskId: string) => request<unknown>(`/tasks/${taskId}`, { method: 'DELETE' }),
};
