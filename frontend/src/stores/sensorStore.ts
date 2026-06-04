import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SensorReading {
  sensorName: string;
  value: number;
  status: 'WET' | 'MODERATE' | 'DRY' | 'unknown';
  timestamp: Date;
}

export interface SensorSettings {
  thresholdWetDry: number;
  thresholdModerateDry: number;
  autoIrrigation: boolean;
}

interface SensorStore {
  sensors: Record<string, SensorReading>;
  settings: SensorSettings;
  connected: boolean;
  irrigationActive: boolean;
  lastUpdate: Date | null;

  // Actions
  setSensor: (sensorName: string, reading: SensorReading) => void;
  setSensors: (sensors: Record<string, SensorReading>) => void;
  setSettings: (settings: SensorSettings) => void;
  setConnected: (connected: boolean) => void;
  setIrrigation: (active: boolean) => void;
  updateTimestamp: () => void;
}

export const useSensorStore = create<SensorStore>()(
  persist(
    (set) => ({
      sensors: {},
      settings: {
        thresholdWetDry: 800,
        thresholdModerateDry: 900,
        autoIrrigation: false,
      },
      connected: false,
      irrigationActive: false,
      lastUpdate: null,

      setSensor: (sensorName, reading) =>
        set((state) => ({
          sensors: { ...state.sensors, [sensorName]: reading },
          lastUpdate: new Date(),
        })),

      setSensors: (sensors) =>
        set({
          sensors,
          lastUpdate: new Date(),
        }),

      setSettings: (settings) => set({ settings }),

      setConnected: (connected) => set({ connected }),

      setIrrigation: (active) => set({ irrigationActive: active }),

      updateTimestamp: () => set({ lastUpdate: new Date() }),
    }),
    {
      name: 'sensor-store',
    }
  )
);
