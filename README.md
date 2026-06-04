# 🌱 Sistema de Monitoramento de Umidade do Solo

Dashboard web em tempo real para monitorar umidade do solo via **Arduino Uno + Node.js + Next.js 15**.

---

## 📦 Pré-requisitos

- [Node.js v24+](https://nodejs.org/) — instale via `winget install OpenJS.NodeJS.LTS`
- [Arduino IDE 2.x](https://www.arduino.cc/en/software)
- Arduino Uno (clone CH340 ou original)
- Sensor capacitivo de umidade do solo

---

## 🔌 Hardware

### Montagem no protoboard

| Componente | Pino Arduino |
|---|---|
| Sensor de umidade (AO) | A0 |
| 🔴 LED Vermelho — Seco | 8 |
| 🟢 LED Verde — Moderado | 13 |
| 🔵 LED Azul — Úmido | 7 |
| Relé de irrigação | 12 |

> ⚠️ **GND obrigatório:** conecte um fio do pino `GND` do Arduino ao trilho negativo (`–`) do protoboard. Sem isso os LEDs não acendem.

### Limiares do sensor (valor analógico 0–1023)

| Faixa | Status | LED |
|---|---|---|
| < 800 | Úmido (WET) | 🔵 Azul |
| 800 – 900 | Moderado (MODERATE) | 🟢 Verde |
| > 900 | Seco (DRY) | 🔴 Vermelho |

---

## 🚀 Como Rodar

### 1. Upload do sketch no Arduino

> ⚠️ **Pare o backend antes de fazer upload** — ele ocupa a porta serial e bloqueia o Arduino IDE.

**Via Arduino IDE:**
1. Abra `sketch_may24a.ino` no Arduino IDE
2. Selecione **Tools → Board → Arduino Uno**
3. Selecione **Tools → Port → COM5** (ou a porta do seu Arduino)
4. Feche o **Serial Monitor** se estiver aberto
5. Clique em **Upload (→)**

**Se travar em "Uploading..." (problema CH340):**

Use o avrdude diretamente com reset manual:
```powershell
# 1. Compile pelo Arduino IDE (Sketch → Export Compiled Binary)
# 2. Execute o comando abaixo e pressione o botão Reset do Arduino imediatamente

& "$env:LOCALAPPDATA\Arduino15\packages\arduino\tools\avrdude\8.0.0-arduino1\bin\avrdude.exe" `
  -C "$env:LOCALAPPDATA\Arduino15\packages\arduino\tools\avrdude\8.0.0-arduino1\etc\avrdude.conf" `
  -p atmega328p -c arduino -P COM5 -b 115200 -D `
  -U "flash:w:$env:LOCALAPPDATA\arduino\sketches\705108A307DFBB2356E11EF84B8455B2\sketch_may24a.ino.hex:i"
```

---

### 2. Backend (Node.js)

```powershell
cd backend
npm install       # apenas na primeira vez
npm start
```

- Servidor disponível em: **http://localhost:3001**
- Conecta automaticamente ao Arduino na **COM5** (9600 baud)
- Reconecta sozinho se a conexão cair

**Configuração (`backend/.env`):**
```env
SERIAL_PORT=COM5          # ajuste para a porta do seu Arduino
PORT=3001
SERIAL_BAUD_RATE=9600
DATABASE_PATH=./data/sensors.db
THRESHOLD_WET_DRY=800
THRESHOLD_MODERATE_DRY=900
```

---

### 3. Frontend (Next.js)

```powershell
cd frontend
npm install       # apenas na primeira vez
npm run dev
```

- Dashboard disponível em: **http://localhost:3000**

---

## 📁 Estrutura do Projeto

```
sketch_may24a/
├── sketch_may24a.ino        # Sketch Arduino
├── backend/
│   ├── server.js            # API REST + WebSocket + Serial
│   ├── package.json
│   ├── .env                 # Configuração (porta COM, limiares)
│   └── data/
│       └── sensors.db       # Banco SQLite (gerado automaticamente)
└── frontend/
    ├── src/
    │   ├── app/             # Páginas Next.js
    │   ├── components/      # SensorCard, Chart, IrrigationControl...
    │   ├── hooks/           # useSensors (TanStack Query)
    │   ├── lib/             # api.ts (Axios client)
    │   └── stores/          # sensorStore (Zustand)
    ├── package.json
    └── .env.local           # NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## 🔧 Protocolo Serial Arduino ↔ Backend

**Arduino → Backend:**
```
SENSOR:SENSOR_1:672:WET:12345678
ACK:irrigation:ON
PONG
INIT:success
```

**Backend → Arduino:**
```
CMD:irrigation:ON
CMD:irrigation:OFF
PING
STATUS
```

---

## 📡 API Endpoints

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/sensors` | Leitura atual de todos os sensores |
| GET | `/api/history?sensorId=SENSOR_1&hours=24` | Histórico de leituras |
| GET | `/api/settings` | Configurações (limiares) |
| POST | `/api/settings` | Atualizar limiares |
| POST | `/api/control/irrigation` | `{ "action": "ON" \| "OFF" }` |
| GET | `/api/health` | Status do servidor e Arduino |
| POST | `/api/ping` | Envia PING ao Arduino |

---

## 🐛 Problemas Conhecidos

| Problema | Causa | Solução |
|---|---|---|
| Upload trava em "Uploading..." | Serial Monitor aberto | Fechar o Serial Monitor antes de fazer upload |
| `ECONNRESET` no upload | Backend ocupando COM5 | Parar o backend antes de fazer upload |
| `initialization failed (rc=-1)` | Driver CH340 com timing ruim | Usar avrdude direto com reset manual (ver seção de upload acima) |
| Dashboard mostra "Carregando..." | Backend parado ou Arduino desconectado | Verificar se `npm start` no backend está rodando |
| Umidade invertida (seco = 100%) | Cálculo sem inversão | Sensor resistivo/capacitivo: valor alto = seco — percentual é `(1024 - valor) / 1024 * 100` |

---

## 🛠️ Stack

| Camada | Tecnologias |
|---|---|
| **Arduino** | C++, Serial 9600 baud, analogRead, digitalWrite |
| **Backend** | Node.js 24, Express, serialport, ws (WebSocket), SQLite3, ESM |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts, TanStack Query v5, Zustand, Axios |

---

**Desenvolvido com ❤️**
