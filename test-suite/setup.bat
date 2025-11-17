@echo off
REM Initialize Test Environment
REM This script sets up everything needed to run the test suite

echo ============================================================
echo TEMPLE PLATFORM - Test Environment Setup
echo ============================================================
echo.

REM Check Node.js
echo [1/5] Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
node --version
echo [OK] Node.js is installed
echo.

REM Check npm
echo [2/5] Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not available!
    pause
    exit /b 1
)
npm --version
echo [OK] npm is available
echo.

REM Install dependencies
echo [3/5] Checking dependencies...
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies already installed
)
echo.

REM Check/Setup database
echo [4/5] Checking database...
if not exist "prisma\dev.db" (
    echo [INFO] Database not found. Creating and seeding...
    call npm run db:seed
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to seed database
        pause
        exit /b 1
    )
    echo [OK] Database created and seeded
) else (
    echo [OK] Database exists
    echo [INFO] To reset database, run: npm run db:seed
)
echo.

REM Create test-results directory
echo [5/5] Setting up test results directory...
if not exist "test-results\" (
    mkdir test-results
    echo [OK] Created test-results directory
) else (
    echo [OK] test-results directory exists
)
echo.

REM Check if server is running
echo ============================================================
echo Checking development server...
echo ============================================================
curl -s -o nul -w "%%{http_code}" http://localhost:3000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Development server is running at http://localhost:3000
    echo.
    echo Ready to run tests!
    echo.
) else (
    echo [WARNING] Development server is not running
    echo.
    echo To start the server, run in another terminal:
    echo   npm run dev
    echo.
    echo Then you can run tests with:
    echo   npm run test:all
    echo.
)

echo ============================================================
echo TEST ENVIRONMENT SETUP COMPLETE
echo ============================================================
echo.
echo Next steps:
echo   1. If server is not running, start it with: npm run dev
echo   2. Run the test suite with: npm run test:all
echo   3. View results in: test-results\test-report-*.txt
echo.
echo Quick commands:
echo   npm run test:all      - Run all tests
echo   npm run test:api      - Run API tests only
echo   npm run test:pages    - Run page tests only
echo   npm run test:features - Run feature tests only
echo.
echo Documentation:
echo   test-suite\README.md              - Quick start guide
echo   test-suite\QUICK-REFERENCE.md     - Commands reference
echo   test-suite\DOCUMENTATION.md       - Full documentation
echo.
pause
