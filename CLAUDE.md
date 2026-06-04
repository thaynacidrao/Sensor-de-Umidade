# Projeto: Sistema de Monitoramento de Umidade do Solo

## Visão Geral
Dashboard web em tempo real para monitorar sensores de umidade do solo via Arduino Uno + Node.js + Next.js 15.

---

## Hardware

### Arduino Uno (clone CH340, COM5)
- **Sensor de umidade:** pino `A0` (sensor capacitivo)
- **LED Verde:** pino `7` → Solo úmido (valor < 800)
- **LED Amarelo:** pino `13` → Umidade moderada (800–900)
- **LED Vermelho:** pino `8` → Solo seco (valor > 900)
  - ⚠️ Pino 5 estava ocupado no protoboard pelo sensor → movido para pino 8
- **Relé de irrigação:** pino `12`
- **Intervalo de leitura:** 500ms

### Sensor
- Tipo: **capacitivo** (lê ~670 no ar seco, ~300 na água)
- Limiares configurados: `< 800` úmido | `800–900` moderado | `> 900` seco

---

## Stack

### Backend (`/backend`)
- Node.js + Express + ESM (`"type": "module"`)
- Porta: **3001**
- Banco de dados: SQLite (`/backend/data/sensors.db`)
- WebSocket para push em tempo real
- Comunicação serial via `serialport` + `@serialport/parser-readline`

### Frontend (`/frontend`)
- Next.js 15 + React 19 + TypeScript
- Porta: **3000**
- Estado global: Zustand
- Queries: TanStack React Query (refetch a cada 2s)
- Gráficos: Recharts
- UI: Tailwind CSS + shadcn/ui + Radix UI

---

## Protocolo Serial Arduino ↔ Backend

### Arduino envia:
```
SENSOR:SENSOR_1:450:WET:12345678
ACK:irrigation:ON
PONG
INIT:success
```

### Backend envia ao Arduino:
```
CMD:irrigation:ON
CMD:irrigation:OFF
PING
STATUS
```

### Fallback (sketch legado):
O backend também entende o formato português do sketch anterior:
```
Porta analogica: 672 Status: Solo umido
```
Mapeamento: `seco` → DRY | `moderado` → MODERATE | `umido/úmido` → WET

---

## Arquivos Alterados Nesta Sessão

| Arquivo | Alteração |
|---|---|
| `sketch_may24a.ino` | LED vermelho: pino 5 → **pino 8**; intervalo: 2000ms → **500ms** |
| `backend/server.js` | Fix ESM WebSocket (`WebSocketServer`); parser fallback "Porta analogica"; log com status original do Arduino |
| `backend/.env` | `SERIAL_PORT=COM5` |
| `frontend/src/lib/api.ts` | Fix: `getSensors()` retornava `response.data.data` em vez de `response.data` |
| `frontend/package.json` | `@radix-ui/react-slot`: `^2.0.2` → `^1.2.4`; adicionados `lucide-react` e `tailwindcss-animate` |
| `frontend/src/components/MockSensorData.tsx` | Fix bug JSDoc com `*/` dentro de template literal |

---

## Como Rodar

### 1. Backend
```powershell
cd backend
npm start
```
Conecta automaticamente ao Arduino na COM5 (9600 baud) e reconecta a cada 5s se cair.

### 2. Frontend
```powershell
cd frontend
npm run dev
```
Acesse: **http://localhost:3000**

### ⚠️ Upload de sketch ao Arduino
- Fechar o backend **antes** de fazer upload (libera a COM5)
- Se o Arduino IDE travar em "Uploading...", fechar o Serial Monitor
- O upload via avrdude funciona com reset manual:
  ```powershell
  # Rodar e pressionar reset físico imediatamente
  avrdude -C avrdude.conf -p atmega328p -c arduino -P COM5 -b 115200 -D -U flash:w:sketch.hex:i
  ```
- Caminho do avrdude: `%LOCALAPPDATA%\Arduino15\packages\arduino\tools\avrdude\8.0.0-arduino1\bin\avrdude.exe`
- Último .hex compilado: `%LOCALAPPDATA%\arduino\sketches\705108A307DFBB2356E11EF84B8455B2\sketch_may24a.ino.hex`

---

## Problemas Conhecidos

| Problema | Causa | Solução |
|---|---|---|
| Upload trava em "Uploading..." | Serial Monitor aberto segura COM5 | Fechar Serial Monitor antes de fazer upload |
| `ECONNRESET` no upload | Backend com COM5 aberta | Parar backend (`Stop-Process node`) antes de upload |
| `initialization failed (rc=-1)` | Driver CH340 com timing incorreto | Usar avrdude direto com reset manual a 115200 baud |
| LED vermelho não acendia | Pino 5 ocupado no protoboard | Movido para pino 8 no sketch |
| Dashboard mostrava `TypeError: Cannot read properties of undefined` | `api.ts` retornava `response.data.data` em vez de `response.data` | Corrigido em `api.ts` |
| LEDs não acendiam | GND do Arduino não conectado ao trilho negativo do protoboard | Conectar fio GND do Arduino ao trilho `-` do protoboard |

---

## Node.js / npm
- Instalado via winget: **Node.js v24.16.0**, npm 11.13.0
- Não estava no PATH previamente — instalado durante esta sessão
