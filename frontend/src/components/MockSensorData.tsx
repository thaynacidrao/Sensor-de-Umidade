'use client';

// Este componente pode ser usado para testar o dashboard sem Arduino real
// Ele simula dados de sensores em tempo real

import React, { useEffect, useState } from 'react';
import { useSensorStore, SensorReading } from '@/stores/sensorStore';

export function useMockSensorData() {
  const { setSensor, setSettings, setConnected } = useSensorStore();
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    // Simular conexão
    setConnected(true);

    // Gerar dados mock
    const mockReadings: Record<string, { value: number; direction: number }> = {
      SENSOR_1: { value: 450, direction: Math.random() > 0.5 ? 1 : -1 },
      SENSOR_2: { value: 750, direction: Math.random() > 0.5 ? 1 : -1 },
      SENSOR_3: { value: 920, direction: Math.random() > 0.5 ? 1 : -1 },
    };

    // Configurações de exemplo
    setSettings({
      thresholdWetDry: 800,
      thresholdModerateDry: 900,
      autoIrrigation: false,
    });

    const interval = setInterval(() => {
      Object.entries(mockReadings).forEach(([sensorName, data]) => {
        // Variar valor entre 0 e 1024 com movimento realista
        const newValue = Math.max(
          0,
          Math.min(1024, data.value + (data.direction * (Math.random() * 20 - 10)))
        );

        // Determinar status
        const status =
          newValue < 800 ? 'WET' : newValue < 900 ? 'MODERATE' : 'DRY';

        mockReadings[sensorName].value = newValue;

        const reading: SensorReading = {
          sensorName,
          value: Math.round(newValue),
          status: status as 'WET' | 'MODERATE' | 'DRY',
          timestamp: new Date(),
        };

        setSensor(sensorName, reading);
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isEnabled, setSensor, setSettings, setConnected]);

  return { isEnabled, setIsEnabled };
}

/**
 * Componente de teste - Adicione ao page.tsx para ativar modo DEMO
 * 
 * Exemplo:
 * ```
 * import { MockSensorProvider } from '@/components/MockSensorData';
 * 
 * export default function Dashboard() {
 *   return (
 *     <MockSensorProvider>
 *       {/* seu dashboard *\/}
 *     </MockSensorProvider>
 *   );
 * }
 * ```
 */
export function MockSensorProvider({ children }: { children: React.ReactNode }) {
  const { isEnabled, setIsEnabled } = useMockSensorData();

  return (
    <div>
      <div className="fixed bottom-4 right-4 z-40 bg-yellow-100 border-2 border-yellow-500 p-4 rounded-lg">
        <p className="text-sm font-bold mb-2">⚠️ MODO DEMO</p>
        <p className="text-xs mb-3">
          {isEnabled
            ? 'Dados simulados - Desconecte do Arduino'
            : 'Clique para simular sensores'}
        </p>
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          className="w-full px-3 py-1 bg-yellow-500 text-white rounded text-sm font-medium"
        >
          {isEnabled ? 'Desativar' : 'Ativar'} Demo
        </button>
      </div>
      {children}
    </div>
  );
}
