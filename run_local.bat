@echo off
echo.
echo 🚀 Starting Expense Bot AI - Local Development
echo ================================================
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
    echo.
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements-local.txt
echo ✅ Dependencies installed
echo.

REM Run database migrations
echo 🗄️ Running database migrations...
alembic upgrade head
echo ✅ Migrations complete
echo.

REM Start the server
echo 🎯 Starting FastAPI server...
echo 📍 API will be available at: http://localhost:8000
echo 📚 Swagger UI at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
