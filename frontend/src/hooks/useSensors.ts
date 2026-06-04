import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { sensorAPI } from '@/lib/api';
import { SensorSettings, SensorReading } from '@/stores/sensorStore';

export function useSensors(): UseQueryResult<
  {
    data: Record<string, SensorReading>;
    settings: SensorSettings;
    connected: boolean;
  },
  Error
> {
  return useQuery({
    queryKey: ['sensors'],
    queryFn: () => sensorAPI.getSensors(),
    refetchInterval: 2000, // Atualizar a cada 2 segundos
    staleTime: 1000, // Considerar data valida por 1 segundo
  });
}

export function useSensorHistory(
  sensorId: string = 'SENSOR_1',
  hours: number = 24
): UseQueryResult<SensorReading[], Error> {
  return useQuery({
    queryKey: ['history', sensorId, hours],
    queryFn: () => sensorAPI.getHistory(sensorId, hours),
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    staleTime: 2000,
  });
}

export function useSensorSettings(): UseQueryResult<SensorSettings, Error> {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => sensorAPI.getSettings(),
    staleTime: 30000, // Considerar dados válidos por 30 segundos
  });
}

export function useSystemStatus(): UseQueryResult<
  { status: string; arduino: string; timestamp: Date },
  Error
> {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => sensorAPI.getSystemStatus(),
    refetchInterval: 5000,
    staleTime: 2000,
  });
}
