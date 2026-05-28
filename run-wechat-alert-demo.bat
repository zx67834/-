@echo off
setlocal EnableExtensions
chcp 65001 >nul

pushd "%~dp0"
set "WX_PY=C:\Users\zxmk7\Documents\wxbot\.venv\Scripts\python.exe"
set "SCRIPT=%~dp0scripts\wechat_alert_demo.py"

echo ========================================
echo  Anti-Fraud WeChat Alert Loop
echo ========================================
echo.

if not exist "%WX_PY%" (
  echo [ERROR] wxauto Python environment was not found:
  echo         %WX_PY%
  pause
  exit /b 1
)

if not exist "%SCRIPT%" (
  echo [ERROR] WeChat bridge script was not found:
  echo         %SCRIPT%
  pause
  exit /b 1
)

echo Make sure:
echo   1. Desktop WeChat is open and logged in.
echo   2. Backend is running: run-model.bat
echo   3. VPN/network is available if the AI model needs it.
echo.

set /p TARGET=Send alert to WeChat chat [default: 墨墨]: 
if "%TARGET%"=="" set "TARGET=墨墨"

set /p SECONDS=Watch seconds [default: 60]: 
if "%SECONDS%"=="" set "SECONDS=60"

echo.
"%WX_PY%" "%SCRIPT%" loop --seconds "%SECONDS%" --alert-to "%TARGET%"

echo.
pause
popd
