@echo off
REM Quick Start Script for Running Tests
REM This script checks if the server is running and starts the test suite

echo ============================================================
echo TEMPLE PLATFORM - TEST SUITE QUICK START
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if database exists
if not exist "prisma\dev.db" (
    echo [WARNING] Database not found. Running seed script...
    call npm run db:seed
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to seed database
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Checking if development server is running...
curl -s -o nul -w "%%{http_code}" http://localhost:3000 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Development server is not running
    echo.
    echo Please start the server in another terminal with:
    echo   npm run dev
    echo.
    echo Then press any key to continue, or Ctrl+C to exit
    pause >nul
)

echo.
echo [INFO] Starting test suite...
echo ============================================================
echo.

call npm run test:all

echo.
echo ============================================================
echo TEST SUITE COMPLETED
echo ============================================================
echo.
echo Check the test-results folder for detailed reports:
echo   test-results\test-report-*.txt  (readable report)
echo   test-results\test-issues-*.json (issues only)
echo.
pause
