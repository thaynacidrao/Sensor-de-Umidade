'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSensors } from '@/hooks/useSensors';
import { useSensorStore } from '@/stores/sensorStore';
import { useQueryClient } from '@tanstack/react-query';
import { sensorAPI } from '@/lib/api';

export function SensorCardComponent({ sensorId }: { sensorId: string }) {
  const { data: sensorsData, isLoading } = useSensors();
  const { setSensor } = useSensorStore();
  const queryClient = useQueryClient();

  const sensor = sensorsData?.data[sensorId];

  useEffect(() => {
    if (sensor) {
      setSensor(sensorId, sensor);
    }
  }, [sensor, sensorId, setSensor]);

  // WebSocket real-time updates
  useEffect(() => {
    const ws = sensorAPI.connectWebSocket((message) => {
      if (message.type === 'sensor_update' && message.data.sensorName === sensorId) {
        setSensor(sensorId, message.data);
        queryClient.invalidateQueries({ queryKey: ['sensors'] });
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, [sensorId, setSensor, queryClient]);

  if (isLoading || !sensor) {
    return <SensorCardSkeleton />;
  }

  // Sensor resistivo/capacitivo: valor alto = seco, valor baixo = úmido → inverter
  const percentage = Math.min(((1024 - sensor.value) / 1024) * 100, 100);
  const statusColors = {
    WET: 'bg-blue-500',
    MODERATE: 'bg-yellow-500',
    DRY: 'bg-red-500',
    unknown: 'bg-gray-400',
  };

  const statusLabels = {
    WET: '💧 Úmido',
    MODERATE: '🌱 Moderado',
    DRY: '🔥 Seco',
    unknown: '❓ Desconhecido',
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-transparent hover:shadow-lg transition-all">
      <div
        className={`h-1 ${statusColors[sensor.status] || 'bg-gray-300'}`}
        style={{ width: '100%' }}
      />
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{sensorId}</CardTitle>
        <CardDescription>
          {statusLabels[sensor.status]} • Atualizado há pouco
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Umidade</span>
            <span className="text-2xl font-bold text-primary">{percentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${statusColors[sensor.status] || 'bg-gray-400'}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted p-2 rounded">
            <p className="text-muted-foreground">Valor Raw</p>
            <p className="font-semibold">{sensor.value}</p>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="text-muted-foreground">Hora</p>
            <p className="font-semibold">
              {new Date(sensor.timestamp).toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SensorCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gray-300" />
      <CardHeader className="pb-3">
        <div className="h-5 bg-gray-300 rounded w-1/3" />
        <div className="h-4 bg-gray-300 rounded w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded-full w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
