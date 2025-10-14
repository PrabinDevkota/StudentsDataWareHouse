@echo off
echo Setting up Student Data Warehouse Backend...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ❌ .env file not found. Please copy env.example to .env and configure it.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Run migrations
echo 🔄 Running database migrations...
node scripts/migrate.js
if %errorlevel% neq 0 (
    echo ❌ Database migration failed
    pause
    exit /b 1
)

REM Run basic seeding
echo 🌱 Running database seeding...
node scripts/seed.js
if %errorlevel% neq 0 (
    echo ❌ Database seeding failed
    pause
    exit /b 1
)

echo ✅ Setup completed successfully!
echo.
echo To start the application:
echo   npm start          (production)
echo   npm run dev        (development)
echo.
echo To run faker seeding:
echo   npm run seed:faker
echo.
pause
