import axios, { AxiosInstance } from 'axios';
import { SensorReading, SensorSettings } from '@/stores/sensorStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class SensorAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 5000,
    });
  }

  async getSensors(): Promise<{
    data: Record<string, SensorReading>;
    settings: SensorSettings;
    connected: boolean;
  }> {
    const response = await this.client.get('/sensors');
    return response.data;
  }

  async getHistory(
    sensorId: string = 'SENSOR_1',
    hours: number = 24,
    limit: number = 500
  ): Promise<SensorReading[]> {
    const response = await this.client.get('/history', {
      params: { sensorId, hours, limit },
    });
    return response.data.data;
  }

  async getSettings(): Promise<SensorSettings> {
    const response = await this.client.get('/settings');
    return response.data.data;
  }

  async updateSettings(settings: Partial<SensorSettings>): Promise<SensorSettings> {
    const response = await this.client.post('/settings', settings);
    return response.data.data;
  }

  async controlIrrigation(action: 'ON' | 'OFF'): Promise<{ action: string; timestamp: Date }> {
    const response = await this.client.post('/control/irrigation', { action });
    return response.data.data;
  }

  async getSystemStatus(): Promise<{ status: string; arduino: string; timestamp: Date }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  async ping(): Promise<void> {
    await this.client.post('/ping');
  }

  async requestStatus(): Promise<void> {
    await this.client.post('/status');
  }

  // WebSocket connection
  connectWebSocket(
    onMessage: (message: any) => void,
    onError?: (error: Event) => void,
    onClose?: () => void
  ): WebSocket {
    const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    if (onError) {
      ws.onerror = onError;
    }

    if (onClose) {
      ws.onclose = onClose;
    }

    return ws;
  }
}

export const sensorAPI = new SensorAPI();
