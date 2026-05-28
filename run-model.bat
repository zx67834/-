@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

pushd "%~dp0"
set "BACKEND_DIR=backend"
set "BACKEND_URL=http://127.0.0.1:7007"

title Anti-Fraud Backend Launcher
echo ========================================
echo  Anti-Fraud Backend - Start Only
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Please install Node.js 18+.
  pause
  exit /b 1
)

if not exist "%BACKEND_DIR%\package.json" (
  echo [ERROR] Backend folder is missing: %BACKEND_DIR%
  pause
  exit /b 1
)

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
)

call :is_listening 7007
if "!PORT_BUSY!"=="1" (
  echo [OK] Backend port 7007 is already in use.
) else (
  start "Anti-Fraud Backend 7007" /D "%BACKEND_DIR%" cmd /k "node start-model.js"
)

call :wait_url "%BACKEND_URL%/api/health" 20
if not "!URL_READY!"=="1" (
  echo [ERROR] Backend did not become ready: %BACKEND_URL%/api/health
  pause
  exit /b 1
)

echo [OK] Backend is ready: %BACKEND_URL%
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
