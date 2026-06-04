'use client';

import React from 'react';
import { useSystemStatus } from '@/hooks/useSensors';

export function Header() {
  const { data: status, isLoading } = useSystemStatus();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-2xl">🌱</div>
          <div className="flex flex-col gap-0">
            <h1 className="text-lg font-bold">Monitoramento de Umidade</h1>
            <p className="text-xs text-slate-500">Sistema de Sensores IoT</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status do Arduino */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <div
              className={`w-2 h-2 rounded-full ${
                status?.arduino === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-medium">
              {isLoading ? 'Verificando...' : status?.arduino === 'connected' ? 'Arduino Conectado' : 'Arduino Desconectado'}
            </span>
          </div>

          {/* Status da Aplicação */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium">Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
