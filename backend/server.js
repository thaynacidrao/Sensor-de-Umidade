import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import sqlite3 from 'sqlite3';
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ===== CONFIGURAÇÃO INICIAL =====
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const SERIAL_PORT = process.env.SERIAL_PORT || 'COM3';
const SERIAL_BAUD = parseInt(process.env.SERIAL_BAUD_RATE) || 9600;
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'data', 'sensors.db');

// ===== ESTADO GLOBAL =====
const state = {
  sensorReadings: {},
  settings: {
    thresholdWetDry: parseInt(process.env.THRESHOLD_WET_DRY) || 800,
    thresholdModerateDry: parseInt(process.env.THRESHOLD_MODERATE_DRY) || 900,
    autoIrrigation: false,
  },
  serialPortConnected: false,
  irrigationActive: false,
};

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== BANCO DE DADOS =====
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log(`📊 Banco de dados conectado: ${DB_PATH}`);
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Tabela para armazenar leituras de sensores
  db.run(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_name TEXT NOT NULL,
      value INTEGER NOT NULL,
      status TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela para armazenar eventos de irrigação
  db.run(`
    CREATE TABLE IF NOT EXISTS irrigation_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela para armazenar configurações
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Tabelas de banco de dados criadas/verificadas');
}

// ===== PORTA SERIAL =====
let serialPort = null;
let parser = null;

function connectToArduino() {
  try {
    serialPort = new SerialPort({
      path: SERIAL_PORT,
      baudRate: SERIAL_BAUD,
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    serialPort.on('open', () => {
      console.log(`🔌 Arduino conectado em ${SERIAL_PORT} (${SERIAL_BAUD} baud)`);
      state.serialPortConnected = true;
      broadcastConnectionStatus();
    });

    parser.on('data', (data) => {
      handleArduinoData(data.trim());
    });

    serialPort.on('error', (err) => {
      console.error('❌ Erro na porta serial:', err.message);
      state.serialPortConnected = false;
      broadcastConnectionStatus();
    });

    serialPort.on('close', () => {
      console.log('⚠️  Arduino desconectado');
      state.serialPortConnected = false;
      broadcastConnectionStatus();
      // Tentar reconectar em 5 segundos
      setTimeout(connectToArduino, 5000);
    });
  } catch (err) {
    console.error('❌ Erro ao abrir porta serial:', err.message);
    setTimeout(connectToArduino, 5000);
  }
}

// ===== PROCESSAMENTO DE DADOS DO ARDUINO =====
function handleArduinoData(data) {
  // Formato: SENSOR:SENSOR_1:450:WET:12345678
  if (data.startsWith('SENSOR:')) {
    const parts = data.split(':');
    if (parts.length >= 5) {
      const sensorName = parts[1];
      const value = parseInt(parts[2]);
      const status = parts[3];
      const timestamp = new Date();

      // Armazenar em estado global
      state.sensorReadings[sensorName] = { value, status, timestamp };

      // Salvar no banco de dados (apenas últimas 24h para performance)
      db.run(
        'INSERT INTO sensor_readings (sensor_name, value, status) VALUES (?, ?, ?)',
        [sensorName, value, status],
        (err) => {
          if (err) console.error('Erro ao salvar leitura:', err);
        }
      );

      // Broadcast via WebSocket
      broadcastSensorUpdate(sensorName, value, status);
    }
  }
  // Mensagens de controle
  else if (data.startsWith('ACK:')) {
    console.log(`✅ Arduino ACK: ${data}`);
  }
  // Resposta de PING
  else if (data === 'PONG') {
    console.log('🔄 Arduino respondeu a PING');
  }
  // Status
  else if (data.startsWith('===')) {
    console.log(`📋 ${data}`);
  }
  // Erros
  else if (data.startsWith('ERROR:')) {
    console.error(`⚠️  Arduino Error: ${data}`);
  }
  // Inicialização
  else if (data === 'INIT:success') {
    console.log('✨ Arduino inicializado com sucesso');
  }
  // Formato alternativo: "Porta analogica: 1023 Status: Solo seco"
  else if (data.startsWith('Porta analogica:')) {
    const match = data.match(/Porta analogica:\s*(\d+)\s*Status:\s*(.+)/i);
    if (match) {
      const value = parseInt(match[1]);
      const rawStatus = match[2].trim().toLowerCase();

      // Mapeia o texto em português do Arduino para os valores do sistema
      let status;
      if (rawStatus.includes('seco'))         status = 'DRY';
      else if (rawStatus.includes('moderado')) status = 'MODERATE';
      else if (rawStatus.includes('mido') || rawStatus.includes('úmido')) status = 'WET';
      else {
        // Fallback: calcula pelos limiares configurados
        status = value < state.settings.thresholdWetDry ? 'WET'
               : value < state.settings.thresholdModerateDry ? 'MODERATE'
               : 'DRY';
      }
      const sensorName = 'SENSOR_1';
      const timestamp = new Date();

      state.sensorReadings[sensorName] = { value, status, timestamp };

      db.run(
        'INSERT INTO sensor_readings (sensor_name, value, status) VALUES (?, ?, ?)',
        [sensorName, value, status],
        (err) => { if (err) console.error('Erro ao salvar leitura:', err); }
      );

      broadcastSensorUpdate(sensorName, value, status);
      console.log(`📡 Arduino: ${sensorName} = ${value} → "${match[2].trim()}" → ${status}`);
    }
  }
  // Log genérico
  else {
    console.log(`📡 Arduino: ${data}`);
  }
}

// ===== COMUNICAÇÃO ARDUINO ↔ BACKEND =====
function sendToArduino(command) {
  if (serialPort && state.serialPortConnected) {
    serialPort.write(command + '\n', (err) => {
      if (err) {
        console.error('❌ Erro ao enviar comando:', err);
      } else {
        console.log(`📤 Enviado ao Arduino: ${command}`);
      }
    });
  } else {
    console.error('❌ Arduino não conectado');
  }
}

// ===== BROADCAST VIA WEBSOCKET =====
function broadcastSensorUpdate(sensorName, value, status) {
  const message = JSON.stringify({
    type: 'sensor_update',
    data: { sensorName, value, status, timestamp: new Date() },
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function broadcastConnectionStatus() {
  const message = JSON.stringify({
    type: 'connection_status',
    data: { connected: state.serialPortConnected },
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// ===== API ROUTES =====

// GET /api/sensors - Último estado de todos os sensores
app.get('/api/sensors', (req, res) => {
  res.json({
    success: true,
    data: state.sensorReadings,
    settings: state.settings,
    connected: state.serialPortConnected,
  });
});

// GET /api/history - Histórico de leituras com filtros
app.get('/api/history', (req, res) => {
  const { sensorId = 'SENSOR_1', hours = 24, limit = 500 } = req.query;

  const query = `
    SELECT sensor_name, value, status, timestamp
    FROM sensor_readings
    WHERE sensor_name = ?
    AND datetime(timestamp) >= datetime('now', '-' || ? || ' hours')
    ORDER BY timestamp DESC
    LIMIT ?
  `;

  db.all(query, [sensorId, parseInt(hours), parseInt(limit)], (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({ success: true, data: rows.reverse() });
    }
  });
});

// GET /api/settings - Obter configurações atuais
app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: state.settings });
});

// POST /api/settings - Atualizar configurações
app.post('/api/settings', (req, res) => {
  const { thresholdWetDry, thresholdModerateDry, autoIrrigation } = req.body;

  if (thresholdWetDry !== undefined) state.settings.thresholdWetDry = thresholdWetDry;
  if (thresholdModerateDry !== undefined) state.settings.thresholdModerateDry = thresholdModerateDry;
  if (autoIrrigation !== undefined) state.settings.autoIrrigation = autoIrrigation;

  res.json({ success: true, data: state.settings });
});

// POST /api/control/irrigation - Controlar irrigação
app.post('/api/control/irrigation', (req, res) => {
  const { action } = req.body; // "ON" ou "OFF"

  if (action === 'ON' || action === 'OFF') {
    sendToArduino(`CMD:irrigation:${action}`);
    state.irrigationActive = action === 'ON';

    // Log no banco de dados
    db.run('INSERT INTO irrigation_events (action) VALUES (?)', [action]);

    // Broadcast para WebSocket
    const message = JSON.stringify({
      type: 'irrigation_status',
      data: { action, timestamp: new Date() },
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    res.json({ success: true, data: { action, timestamp: new Date() } });
  } else {
    res.status(400).json({ success: false, error: 'Invalid action (use ON or OFF)' });
  }
});

// POST /api/status - Solicitar status do Arduino
app.post('/api/status', (req, res) => {
  sendToArduino('STATUS');
  res.json({ success: true, message: 'Status request sent to Arduino' });
});

// POST /api/ping - Verificar conexão com Arduino
app.post('/api/ping', (req, res) => {
  sendToArduino('PING');
  res.json({ success: true, message: 'PING sent to Arduino' });
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'online',
    arduino: state.serialPortConnected ? 'connected' : 'disconnected',
    timestamp: new Date(),
  });
});

// ===== WEBSOCKET =====
wss.on('connection', (ws) => {
  console.log('🌐 Cliente WebSocket conectado');

  // Enviar estado atual ao conectar
  ws.send(
    JSON.stringify({
      type: 'current_state',
      data: {
        sensors: state.sensorReadings,
        settings: state.settings,
        connected: state.serialPortConnected,
      },
    })
  );

  ws.on('close', () => {
    console.log('🌐 Cliente WebSocket desconectado');
  });

  ws.on('error', (err) => {
    console.error('❌ Erro WebSocket:', err);
  });
});

// ===== INICIALIZAÇÃO DO SERVIDOR =====
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║ 🌱 Soil Moisture Backend - Rodando!        ║
║ 🚀 Servidor: http://localhost:${PORT}      ║
║ 🌐 WebSocket: ws://localhost:${PORT}       ║
║ 📚 API Docs: /api/*                        ║
╚════════════════════════════════════════════╝
  `);

  // Conectar ao Arduino
  connectToArduino();
});

// ===== TRATAMENTO DE SINAIS =====
process.on('SIGINT', () => {
  console.log('\n⏹️  Desligando servidor...');
  if (serialPort) {
    serialPort.close();
  }
  db.close();
  server.close();
  process.exit(0);
});
