type MessageCallback = (data: any) => void;

export class RealtimeStreamService {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private listeners: Set<MessageCallback> = new Set();
  private isConnected = false;
  private reconnectTimeout: any = null;
  private lastMessageTime = 0;

  constructor() {
    this.connect();
    this.startFallbackPoller();
  }

  public subscribe(cb: MessageCallback) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private getHost(): string {
    if (typeof window !== 'undefined' && window.location.hostname) {
      return window.location.hostname;
    }
    return '127.0.0.1';
  }

  private connect() {
    if (typeof window === 'undefined') return;

    try {
      const host = this.getHost();
      const wsUrl = `ws://${host}:8000/api/v1/ws/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
      };

      this.ws.onmessage = (event) => {
        try {
          this.lastMessageTime = Date.now();
          const data = JSON.parse(event.data);
          this.listeners.forEach((cb) => cb(data));
        } catch (e) {}
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        if (this.ws) this.ws.close();
      };
    } catch (e) {
      this.connectSSE();
    }
  }

  private connectSSE() {
    if (typeof window === 'undefined') return;
    try {
      const host = this.getHost();
      this.sse = new EventSource(`http://${host}:8000/api/v1/stream/live-events`);
      this.sse.onmessage = (event) => {
        try {
          this.lastMessageTime = Date.now();
          const data = JSON.parse(event.data);
          this.listeners.forEach((cb) => cb(data));
        } catch (e) {}
      };
    } catch (e) {}
  }

  private startFallbackPoller() {
    if (typeof window === 'undefined') return;
    setInterval(async () => {
      // If WS has not delivered data within the last 1500ms, pull directly from REST
      if (!this.isConnected || Date.now() - this.lastMessageTime > 1500) {
        try {
          const host = this.getHost();
          const [sRes, pRes] = await Promise.all([
            fetch(`http://${host}:8000/api/v1/metrics/summary`),
            fetch(`http://${host}:8000/api/v1/pipeline/health`)
          ]);
          if (sRes.ok) {
            const summary = await sRes.json();
            const pipeline = pRes.ok ? await pRes.json() : null;
            this.listeners.forEach((cb) => cb({ summary, pipeline }));
          }
        } catch (e) {}
      }
    }, 1000);
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  public getStatus() {
    return this.isConnected;
  }
}

export const realtimeService = new RealtimeStreamService();
