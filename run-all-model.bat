@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

pushd "%~dp0"
set "BACKEND_DIR=backend"
set "FRONTEND_DIR=frontend"
set "BACKEND_URL=http://127.0.0.1:7007"
set "FRONTEND_URL=http://127.0.0.1:8008"

title Anti-Fraud App Launcher
echo ========================================
echo  Anti-Fraud App - Start All
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Please install Node.js 18+.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found. Please reinstall Node.js.
  pause
  exit /b 1
)

if not exist "%BACKEND_DIR%\package.json" (
  echo [ERROR] Backend folder is missing: %BACKEND_DIR%
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend folder is missing: %FRONTEND_DIR%
  pause
  exit /b 1
)

echo [1/5] Checking backend dependencies...
if not exist "%BACKEND_DIR%\node_modules" (
  pushd "%BACKEND_DIR%"
  call npm install
  if errorlevel 1 (
    popd
    echo [ERROR] Backend dependency install failed.
    pause
    exit /b 1
  )
  popd
) else (
  echo [OK] Backend dependencies are ready.
)

echo [2/5] Starting backend on 127.0.0.1:7007...
call :is_listening 7007
if "!PORT_BUSY!"=="1" (
  echo [OK] Backend port 7007 is already in use. Keeping existing service.
) else (
  start "Anti-Fraud Backend 7007" /D "%BACKEND_DIR%" cmd /k "node start-model.js"
)

echo [3/5] Waiting for backend health check...
call :wait_url "%BACKEND_URL%/api/health" 20
if not "!URL_READY!"=="1" (
  echo [ERROR] Backend did not become ready: %BACKEND_URL%/api/health
  pause
  exit /b 1
)
echo [OK] Backend is ready.

echo [4/5] Checking frontend dependencies...
if not exist "%FRONTEND_DIR%\node_modules" (
  pushd "%FRONTEND_DIR%"
  call npm install
  if errorlevel 1 (
    popd
    echo [ERROR] Frontend dependency install failed.
    pause
    exit /b 1
  )
  popd
) else (
  echo [OK] Frontend dependencies are ready.
)

echo [5/5] Starting frontend on 127.0.0.1:8008...
call :is_listening 8008
if "!PORT_BUSY!"=="1" (
  echo [OK] Frontend port 8008 is already in use. Keeping existing service.
) else (
  start "Anti-Fraud Frontend 8008" /D "%FRONTEND_DIR%" cmd /k "npm run dev -- --host 127.0.0.1 --port 8008"
)

call :wait_url "%FRONTEND_URL%" 30
if not "!URL_READY!"=="1" (
  echo [ERROR] Frontend did not become ready: %FRONTEND_URL%
  echo Run stop.bat, then run this script again.
  pause
  exit /b 1
)

echo.
echo ========================================
echo  Started successfully
echo  Frontend: %FRONTEND_URL%
echo  Backend : %BACKEND_URL%
echo  Database: controlled by backend/.env
echo ========================================
echo.
start "" "%FRONTEND_URL%"
popd
pause
exit /b 0

:is_listening
set "PORT_BUSY=0"
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%~1 .*LISTENING"') do (
  set "PORT_BUSY=1"
)
exit /b 0

:wait_url
set "URL_READY=0"
set "TARGET_URL=%~1"
set "MAX_WAIT=%~2"
for /l %%I in (1,1,%MAX_WAIT%) do (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri '%TARGET_URL%' -TimeoutSec 2; if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>nul
  if not errorlevel 1 (
    set "URL_READY=1"
    exit /b 0
  )
  timeout /t 1 /nobreak >nul
)
exit /b 0
