@echo off
setlocal enabledelayedexpansion

echo ================================================================================
echo TEMPLE PLATFORM - Test Suite with Auto Server Management
echo ================================================================================
echo.

REM Check if server is running
echo Checking if server is already running...
netstat -an | findstr ":3000" | findstr "LISTENING" > nul
if !errorlevel! equ 0 (
    echo [OK] Server is already running on port 3000
    set "SERVER_WAS_RUNNING=true"
) else (
    echo [INFO] Server is not running. Starting development server...
    set "SERVER_WAS_RUNNING=false"
    
    REM Start the dev server in a separate minimized window
    start "Temple Dev Server" /MIN cmd /c "cd /d %~dp0.. && npm run dev"
    
    REM Wait for server to be ready
    echo Waiting for server to start...
    set /a counter=0
    
    :wait_loop
    timeout /t 2 /nobreak > nul
    netstat -an | findstr ":3000" | findstr "LISTENING" > nul
    if !errorlevel! equ 0 (
        echo [OK] Server is ready!
        goto server_ready
    )
    
    set /a counter+=1
    if !counter! GTR 29 (
        echo [ERROR] Server failed to start within 60 seconds
        exit /b 1
    )
    
    echo Still waiting... (!counter!/30)
    goto wait_loop
)

:server_ready
echo.
echo ================================================================================
echo Running Test Suite
echo ================================================================================
echo.

REM Run the tests
cd /d %~dp0
call npm run test:suite

set TEST_EXIT_CODE=%errorlevel%

REM Only stop server if we started it
if "%SERVER_WAS_RUNNING%"=="false" (
    echo.
    echo ================================================================================
    echo Stopping Development Server
    echo ================================================================================
    
    REM Find and kill the node process on port 3000
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
        echo Stopping server process %%a...
        taskkill /F /PID %%a > nul 2>&1
    )
    echo [OK] Server stopped
)

echo.
echo ================================================================================
echo Test Suite Complete
echo ================================================================================
echo Exit Code: %TEST_EXIT_CODE%

exit /b %TEST_EXIT_CODE%
