#!/bin/bash

# Application Start Script
# This script starts the Student Data Warehouse backend

echo "Starting Student Data Warehouse Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if database is migrated
echo "🔍 Checking database migration status..."
node -e "
const { testConnection } = require('./src/config/db');
testConnection().then(connected => {
  if (!connected) {
    console.log('❌ Database connection failed. Please check your MySQL configuration (MYSQL_URL or MYSQL_* variables) in .env');
    process.exit(1);
  }
  console.log('✅ Database connection successful');
}).catch(err => {
  console.log('❌ Database connection failed:', err.message);
  process.exit(1);
});
"

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed. Please check your configuration."
    exit 1
fi

# Start the application
echo "🚀 Starting the application..."
if [ "$1" = "dev" ]; then
    echo "Running in development mode with nodemon..."
    npm run dev
else
    echo "Running in production mode..."
    npm start
fi
