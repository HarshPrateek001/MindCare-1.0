#!/bin/bash

echo "🧠 Starting MindCare Server..."
echo "================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "backend/main.py" ]; then
    echo "❌ Error: backend/main.py not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
pip3 install -r requirements.txt

# Start the server
echo ""
echo "🚀 Starting server on http://localhost:8000"
echo "📚 API documentation: http://localhost:8000/docs"
echo "Press Ctrl+C to stop the server"
echo ""
python3 main.py
