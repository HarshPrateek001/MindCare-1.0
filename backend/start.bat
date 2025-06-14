@echo off
echo Starting MindCare Server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "backend\main.py" (
    echo Error: backend\main.py not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...
cd backend
pip install -r requirements.txt

REM Start the server
echo.
echo Starting server on http://localhost:8000
echo Press Ctrl+C to stop the server
echo.
python main.py

pause
