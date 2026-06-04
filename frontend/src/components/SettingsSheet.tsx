'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSensorSettings } from '@/hooks/useSensors';
import { sensorAPI } from '@/lib/api';
import { useSensorStore } from '@/stores/sensorStore';
import { Loader2 } from 'lucide-react';

export function SettingsSheet() {
  const { data: currentSettings } = useSensorSettings();
  const { setSettings } = useSensorStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    thresholdWetDry: currentSettings?.thresholdWetDry || 800,
    thresholdModerateDry: currentSettings?.thresholdModerateDry || 900,
  });

  const handleChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updated = await sensorAPI.updateSettings(formData);
      setSettings(updated);
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline">
        ⚙️ Configurações
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
          <CardDescription>Ajuste os limiares de umidade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Threshold Wet/Dry */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Limiar Úmido/Moderado: {formData.thresholdWetDry}
            </label>
            <input
              type="range"
              min="0"
              max="1024"
              value={formData.thresholdWetDry}
              onChange={(e) => handleChange('thresholdWetDry', parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-slate-500">
              Valores menores = úmido | Valores maiores = seco
            </p>
          </div>

          {/* Threshold Moderate/Dry */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Limiar Moderado/Seco: {formData.thresholdModerateDry}
            </label>
            <input
              type="range"
              min="0"
              max="1024"
              value={formData.thresholdModerateDry}
              onChange={(e) => handleChange('thresholdModerateDry', parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Current thresholds reference */}
          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded text-sm space-y-1">
            <p>📊 Classificação Atual:</p>
            <p>💧 Úmido: 0 - {formData.thresholdWetDry}</p>
            <p>🌱 Moderado: {formData.thresholdWetDry} - {formData.thresholdModerateDry}</p>
            <p>🔥 Seco: {formData.thresholdModerateDry} - 1024</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
