const DEFAULT_PORT = '8000';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '' : `http://127.0.0.1:${DEFAULT_PORT}`);

async function safeFetch(endpoint: string, options?: RequestInit) {
  // If API_BASE is relative or set, try it first
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (res.ok) return res;
    // If relative returned 404 or bad gateway, try direct backend port 8000
    if (typeof window !== 'undefined' && !API_BASE) {
      const direct = await fetch(`http://${window.location.hostname || '127.0.0.1'}:8000${endpoint}`, options);
      if (direct.ok) return direct;
    }
    return res;
  } catch (err) {
    // If relative fetch failed, try direct 8000 then 8005
    if (typeof window !== 'undefined') {
      try {
        const direct8000 = await fetch(`http://${window.location.hostname || '127.0.0.1'}:8000${endpoint}`, options);
        if (direct8000.ok) return direct8000;
      } catch (_) {}
      try {
        const direct8005 = await fetch(`http://${window.location.hostname || '127.0.0.1'}:8005${endpoint}`, options);
        if (direct8005.ok) return direct8005;
      } catch (_) {}
    }
    throw err;
  }
}

export async function fetchSummary() {
  const res = await safeFetch('/api/v1/metrics/summary', { cache: 'no-store' });
  return res.json();
}

export async function fetchSentimentTrend() {
  const res = await safeFetch('/api/v1/metrics/sentiment-trend', { cache: 'no-store' });
  return res.json();
}

export async function fetchMentionsOverTime() {
  const res = await safeFetch('/api/v1/metrics/mentions-over-time', { cache: 'no-store' });
  return res.json();
}

export async function fetchTopTopics() {
  const res = await safeFetch('/api/v1/metrics/top-topics', { cache: 'no-store' });
  return res.json();
}

export async function fetchTopEntities() {
  const res = await safeFetch('/api/v1/metrics/top-entities', { cache: 'no-store' });
  return res.json();
}

export async function fetchShareOfVoice() {
  const res = await safeFetch('/api/v1/metrics/share-of-voice', { cache: 'no-store' });
  return res.json();
}

export async function fetchAlerts() {
  const res = await safeFetch('/api/v1/alerts', { cache: 'no-store' });
  return res.json();
}

export async function fetchPipelineHealth() {
  const res = await safeFetch('/api/v1/pipeline/health', { cache: 'no-store' });
  return res.json();
}

export async function fetchTraces() {
  const res = await safeFetch('/api/v1/traces', { cache: 'no-store' });
  return res.json();
}

export async function startReplay(speed = 10.0) {
  const res = await safeFetch('/api/v1/replay/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed })
  });
  return res.json();
}

export async function stopReplay() {
  const res = await safeFetch('/api/v1/replay/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  return res.json();
}

export async function askAIQuery(query: string) {
  const res = await safeFetch('/api/v1/ai/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${errorText}`);
  }
  return res.json();
}
