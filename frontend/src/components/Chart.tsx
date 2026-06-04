'use client';

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSensorHistory } from '@/hooks/useSensors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartProps {
  sensorId?: string;
  hours?: number;
}

export function SensorChart({ sensorId = 'SENSOR_1', hours = 24 }: ChartProps) {
  const { data: historyData, isLoading } = useSensorHistory(sensorId, hours);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (historyData) {
      // Preparar dados para o gráfico
      const formattedData = historyData.map((reading: any) => ({
        timestamp: new Date(reading.timestamp).toLocaleTimeString('pt-BR'),
        value: reading.value,
        status: reading.status,
        originalTime: new Date(reading.timestamp),
      }));

      // Limitar a 500 pontos para performance
      if (formattedData.length > 500) {
        const step = Math.ceil(formattedData.length / 500);
        setChartData(formattedData.filter((_, i) => i % step === 0));
      } else {
        setChartData(formattedData);
      }
    }
  }, [historyData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando histórico...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Histórico de Umidade</CardTitle>
        <CardDescription>
          Últimas {hours} horas de dados de {sensorId}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(chartData.length / 6)}
                />
                <YAxis
                  domain={[0, 1024]}
                  label={{ value: 'Valor (0-1024)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}
                  formatter={(value) => [value, 'Umidade']}
                  labelFormatter={(label) => `Hora: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  dot={false}
                  name="Umidade (raw)"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
