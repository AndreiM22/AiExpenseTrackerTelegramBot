#!/bin/bash

echo "🧪 Testing Local Setup"
echo "======================"
echo ""

# Activate venv
source venv/bin/activate

# Install just the essentials first
echo "📦 Installing core dependencies..."
pip install fastapi uvicorn sqlalchemy alembic pydantic pydantic-settings python-dotenv -q

echo "✅ Core dependencies installed"
echo ""

# Check if we can import the app
echo "🔍 Testing imports..."
python3 -c "from app.main import app; print('✅ App imports successfully!')"

echo ""
echo "🎉 Local setup is working!"
echo ""
echo "Next steps:"
echo "1. Run: ./run_local.sh"
echo "2. Open: http://localhost:8000/docs"
