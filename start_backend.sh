#!/bin/bash

# Start the AI Image Enhancement Backend
# This script sets the required environment variables and starts the server

echo "🚀 Starting AI Image Enhancement Backend..."

# Set environment variables
# Note: Set REPLICATE_API_TOKEN environment variable before running this script
# export REPLICATE_API_TOKEN="your_token_here"
export PORT=5001
export HOST="0.0.0.0"
export DEBUG="False"

echo "✅ Environment variables set:"
echo "   - REPLICATE_API_TOKEN: [CONFIGURED]"
echo "   - PORT: $PORT"
echo "   - HOST: $HOST"
echo "   - DEBUG: $DEBUG"

# Change to backend directory
cd backend

# Check if Python virtual environment exists
if [ -d "venv" ]; then
    echo "🔧 Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    
    echo "📦 Installing dependencies..."
    pip install -r requirements.txt
fi

echo "🌐 Starting server on http://$HOST:$PORT"
echo "📋 Available endpoints:"
echo "   - POST /enhance - Image enhancement"
echo "   - GET /health - Health check"
echo "   - POST /api/replicate/predictions - Create Replicate prediction"
echo "   - GET /api/replicate/predictions/<id> - Get Replicate prediction status"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the Flask application
python app.py 