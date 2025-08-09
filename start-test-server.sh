#!/bin/bash

echo "🚀 Starting local test server..."
echo "================================"
echo ""
echo "Server will run at: http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

# Start a simple Python HTTP server
python3 -m http.server 8000