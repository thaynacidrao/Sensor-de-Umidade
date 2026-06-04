'use client';

import React from 'react';
import { SensorCardComponent } from '@/components/SensorCard';
import { SensorChart } from '@/components/Chart';
import { SettingsSheet } from '@/components/SettingsSheet';
import { IrrigationControl } from '@/components/IrrigationControl';
import { useSensors } from '@/hooks/useSensors';

export default function Dashboard() {
  const { data: sensorsData, isLoading } = useSensors();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <div className="flex gap-2">
            <SettingsSheet />
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Sensor Card */}
          {!isLoading && sensorsData ? (
            <SensorCardComponent sensorId="SENSOR_1" />
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-500">Carregando sensor...</p>
            </div>
          )}

          {/* Irrigation Control */}
          <IrrigationControl />
        </div>

        {/* Chart Section */}
        <div className="grid gap-6">
          <SensorChart sensorId="SENSOR_1" hours={24} />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
          <p>🌱 Sistema de Monitoramento de Umidade do Solo v1.0</p>
          <p>Desenvolvido com Next.js 15, Arduino e TypeScript</p>
        </footer>
      </div>
    </main>
  );
}
