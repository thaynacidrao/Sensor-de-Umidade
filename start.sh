#!/bin/bash
# Script para iniciar todo o projeto (Linux/Mac)

echo "🌱 Iniciando Sistema de Monitoramento de Umidade..."
echo ""

# Terminal 1: Backend
echo "📡 Iniciando Backend em nova janela..."
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    open -a Terminal "cd $(pwd)/backend && npm run dev"
else
    # Linux
    gnome-terminal -- bash -c "cd $(pwd)/backend && npm run dev; exec bash"
fi

sleep 3

# Terminal 2: Frontend
echo "🎨 Iniciando Frontend em nova janela..."
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    open -a Terminal "cd $(pwd)/frontend && npm run dev"
else
    # Linux
    gnome-terminal -- bash -c "cd $(pwd)/frontend && npm run dev; exec bash"
fi

echo ""
echo "✅ Serviços iniciados!"
echo ""
echo "📍 Acesse:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo ""
echo "⚠️  Não esqueça de:"
echo "   1. Upload do sketch_may24a.ino no Arduino"
echo "   2. Verificar SERIAL_PORT em backend/.env"
echo "   3. Criar backend/.env baseado em .env.example"
echo "   4. Criar frontend/.env.local baseado em .env.local.example"
