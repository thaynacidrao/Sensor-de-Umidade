# 🚀 Guia de Instalação e Execução

## ⚡ Quick Start (5 minutos)

### Requisitos
- Arduino IDE instalado
- Node.js 18+ instalado
- Porta USB disponível para Arduino

### Passo 1: Arduino
```bash
# 1. Abra Arduino IDE
# 2. Carregue o arquivo: sketch_may24a.ino
# 3. Selecione sua porta serial (Tools → Port)
# 4. Clique em Upload
```

### Passo 2: Backend
```bash
cd backend
cp .env.example .env

# Editar .env e verificar SERIAL_PORT
# Exemplos:
# SERIAL_PORT=COM3          (Windows)
# SERIAL_PORT=/dev/ttyUSB0  (Linux)
# SERIAL_PORT=/dev/ttyACM0  (Mac)

npm install
npm run dev
```

✅ Backend rodando em `http://localhost:3001`

### Passo 3: Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

✅ Frontend rodando em `http://localhost:3000`

**Abra http://localhost:3000 no navegador!**

---

## 📋 Checklist de Verificação

- [ ] Arduino conectado via USB
- [ ] Arduino IDE mostra "Upload successful"
- [ ] Backend inicia sem erros de porta serial
- [ ] Backend mostra "Arduino conectado" (ou tenta reconectar)
- [ ] Frontend carrega sem erros de API
- [ ] Cards de sensores aparecem (mesmo com valores 0 inicialmente)
- [ ] Gráfico carrega com dados históricos
- [ ] Status "Arduino Conectado" aparece no header

---

## 🔍 Testando Comunicação

### Via Arduino IDE Serial Monitor
```
1. Abra Serial Monitor (Tools → Serial Monitor)
2. Defina baud rate para 9600
3. Observe a saída dos sensores:
   SENSOR:SENSOR_1:450:WET:1234567890
   SENSOR:SENSOR_2:850:MODERATE:1234567891
   ...
```

### Via Backend
```bash
# Terminal do backend mostra:
🔌 Arduino conectado em COM3 (9600 baud)
✨ Arduino inicializado com sucesso
📡 Arduino: SENSOR:SENSOR_1:450:WET:...
```

### Via Frontend
```
1. Abra DevTools (F12)
2. Vá para Console
3. Verifique se não há erros de API
4. Verifique se dados chegam via:
   Network tab → WebSocket frame
```

---

## 🛠️ Comandos Úteis

### Backend
```bash
npm run dev        # Desenvolvimento com reload automático
npm start          # Produção

# Testar PING Arduino
curl -X POST http://localhost:3001/api/ping

# Obter status dos sensores
curl http://localhost:3001/api/sensors

# Controlar irrigação
curl -X POST http://localhost:3001/api/control/irrigation \
  -H "Content-Type: application/json" \
  -d '{"action":"ON"}'
```

### Frontend
```bash
npm run dev       # Desenvolvimento
npm run build     # Build otimizado
npm start         # Servir build
npm run lint      # Verificar tipos TypeScript
```

---

## 📱 Acessar de Outro Dispositivo

### Mobile no mesmo WiFi
1. No computador, descubra seu IP local:
   - Windows: `ipconfig` → IPv4 Address
   - Linux/Mac: `ifconfig` → inet

2. No mobile, acesse:
   ```
   http://[SEU_IP]:3000
   ```

3. Edite `frontend/.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://[SEU_IP]:3001
   ```

4. Reinicie frontend

---

## 🐛 Resolução de Problemas Comuns

### "ENOENT: no such file or directory, open 'COM3'"
**Solução:**
- Verifique a porta correta em Gerenciador de Dispositivos
- Atualize `SERIAL_PORT` em `backend/.env`
- Reinicie o servidor backend

### "Module not found: 'serialport'"
**Solução:**
```bash
cd backend
npm install  # Reinstalar dependências
npm run dev
```

### Gráfico vazio mas dados chegam
**Solução:**
- Aguarde 5-10 segundos para histórico ser preenchido
- Verifique banco de dados: `backend/data/sensors.db`
- Limpe cache do navegador (Ctrl+Shift+Delete)

### "WebSocket connection failed"
**Solução:**
- Verifique se backend está rodando
- Verifique se `NEXT_PUBLIC_API_URL` em frontend está correto
- Procure por CORS errors no console

---

## 📦 Estrutura de Pastas Importante

```
sketch_may24a/
├── sketch_may24a.ino              # Arduino - Upload aqui primeiro
│
├── backend/
│   ├── server.js                  # Servidor principal
│   ├── package.json
│   ├── .env                       # ⚠️ NÃO commit (sensível)
│   ├── .env.example               # ✅ Copiar e editar
│   └── data/
│       └── sensors.db             # Banco de dados
│
└── frontend/
    ├── src/
    │   ├── app/page.tsx           # Página principal
    │   ├── components/
    │   ├── hooks/
    │   └── stores/
    ├── package.json
    ├── .env.local                 # ⚠️ NÃO commit
    └── .env.local.example         # ✅ Copiar e editar
```

---

## 🎯 Fluxo de Dados Completo

```
Arduino (A0, A1, A2)
    ↓ (Serial @ 9600 baud)
Backend (server.js)
    ├─ Parseia dados
    ├─ Salva no SQLite
    └─ Broadcast via WebSocket
        ↓
Frontend (Next.js)
    ├─ Atualiza cards em tempo real
    ├─ Refresca gráfico
    └─ Notifica mudanças de status
```

---

## 📊 Monitoring

### Ver logs em tempo real
```bash
# Backend
tail -f backend/*.log  # Linux/Mac
type nul > backend/debug.log  # Windows (depois monitorar)

# Browser
DevTools → Console → Filtrar por "API"
```

### Banco de dados
```bash
# Ver histórico de sensores
sqlite3 backend/data/sensors.db
> SELECT * FROM sensor_readings LIMIT 10;
> .mode column
> .headers on
```

---

## ✨ Tips & Tricks

1. **Reiniciar tudo rápido:**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   
   # Terminal 3 - Arduino Serial Monitor
   # Abrir em Arduino IDE
   ```

2. **Ver dados em tempo real:**
   ```
   Browser DevTools → Network → WS
   Aqui você vê o WebSocket em ação
   ```

3. **Resetar dados históricos:**
   ```bash
   rm backend/data/sensors.db
   # Reiniciar backend
   ```

4. **Mudar intervalo de leitura:**
   - Arduino: `READ_INTERVAL = 2000` (em millisegundos)
   - Backend: `refetchInterval: 2000` em `useSensors.ts`

---

## 🎓 Próximos Passos

1. **Testar irrigação:**
   - Quando a bomba chegar, conectar no pino 12
   - Button no frontend automaticamente funcionará

2. **Adicionar mais sensores:**
   - Arduino: Descomente pinos A3, A4, etc.
   - Backend: Será automático (detecta qualquer SENSOR_N)
   - Frontend: Adicione `<SensorCardComponent sensorId="SENSOR_4" />`

3. **Deploy (futuro):**
   - Frontend: Vercel (gratuito)
   - Backend: Heroku, Railway, ou VPS

---

## 📞 Suporte

Se algo não funcionar:
1. Verifique os logs (Console do browser + Terminal)
2. Confirme que todos os 3 serviços estão rodando
3. Reinicie tudo
4. Verifique Hardware (Arduino, cabos USB)

**Sucesso! 🚀**
