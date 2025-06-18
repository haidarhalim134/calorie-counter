#!/bin/bash

set -a
source .env
set +a

echo "Starting Flask (Gunicorn)..."
gunicorn -w 4 -b 127.0.0.1:5000 flask_service.app:app &

FLASK_PID=$!

echo "Starting Express app..."
node index.js

kill $FLASK_PID
