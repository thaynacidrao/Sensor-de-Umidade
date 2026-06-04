'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sensorAPI } from '@/lib/api';
import { useSensorStore } from '@/stores/sensorStore';
import { Loader2, Droplet } from 'lucide-react';

export function IrrigationControl() {
  const { irrigationActive, setIrrigation } = useSensorStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      const newAction = irrigationActive ? 'OFF' : 'ON';
      await sensorAPI.controlIrrigation(newAction as 'ON' | 'OFF');
      setIrrigation(!irrigationActive);
    } catch (error) {
      console.error('Erro ao controlar irrigação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="w-5 h-5" />
          Sistema de Irrigação
        </CardTitle>
        <CardDescription>
          {irrigationActive ? '💧 Bomba ATIVA' : '🔌 Bomba INATIVA'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            ⚠️ Aviso: A bomba ainda não foi instalada. Este é um teste de interface.
          </p>
          <p className="text-xs text-slate-500">
            Quando a bomba for conectada no pino 12 do Arduino, este controle funcionará.
          </p>
        </div>

        <Button
          onClick={handleToggle}
          disabled={isLoading}
          variant={irrigationActive ? 'destructive' : 'default'}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : irrigationActive ? (
            <>
              <Droplet className="mr-2 h-4 w-4" />
              Desativar Irrigação
            </>
          ) : (
            <>
              <Droplet className="mr-2 h-4 w-4" />
              Ativar Irrigação
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-muted p-2 rounded">
            <p className="text-muted-foreground text-xs">Status</p>
            <p className="font-semibold">
              {irrigationActive ? '🟢 Ativo' : '🔴 Inativo'}
            </p>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="text-muted-foreground text-xs">Hardware</p>
            <p className="font-semibold">Pino 12 (Relé)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
