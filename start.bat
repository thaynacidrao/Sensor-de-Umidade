@echo off
REM Script para iniciar todo o projeto (Windows)

echo 🌱 Iniciando Sistema de Monitoramento de Umidade...
echo.

echo 📡 Iniciando Backend...
start cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak

echo 🎨 Iniciando Frontend...
start cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Serviços iniciados em novas janelas!
echo.
echo 📍 Acesse:
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:3001
echo.
echo ⚠️  Não esqueça de:
echo    1. Upload do sketch_may24a.ino no Arduino
echo    2. Verificar SERIAL_PORT em backend\.env
echo    3. Criar backend\.env baseado em .env.example
echo    4. Criar frontend\.env.local baseado em .env.local.example
