@echo off
set SOURCE_DIR=source
set PORT=3000

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js not installed!
    echo Visit https://nodejs.org/
    exit /b 1
)

:: Check source directory
if not exist "%SOURCE_DIR%" (
    echo Error: Invalid repository structure!
    exit /b 1
)

cd %SOURCE_DIR%

:: Install dependencies
echo Installing dependencies...
npm ci --silent --no-progress
if %errorlevel% neq 0 exit /b 1

:: Build project
echo Building application...
npm run build -- --no-color
if %errorlevel% neq 0 exit /b 1

:: Start application
echo Starting Application...
start "" "cmd.exe" /c "npm run dev -- --port %PORT%"

timeout /t 5 >nul
echo.
echo Successfully launched BlockHub!
echo Access the application at http://localhost:%PORT%
pause
