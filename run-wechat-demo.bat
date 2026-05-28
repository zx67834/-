@echo off
setlocal EnableExtensions
chcp 65001 >nul

pushd "%~dp0"
set "WX_PY=C:\Users\zxmk7\Documents\wxbot\.venv\Scripts\python.exe"
set "SCRIPT=scripts\wechat_alert_demo.py"

echo ========================================
echo  Anti-Fraud WeChat Demo
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

echo Prerequisites:
echo   1. Desktop WeChat is open and logged in.
echo   2. Backend is running: run-model.bat
echo   3. VPN is on if the AI model needs it.
echo.
echo Demo flow:
echo   - Use another WeChat account to send a suspicious message to this PC account.
echo   - When risk is detected, a desktop popup appears and a reminder is sent to 墨墨.
echo   - To stop: run stop-wechat-auto.bat
echo.

set "SECONDS=300"
set /p SECONDS=Watch seconds [default 300]: 
if "%SECONDS%"=="" set "SECONDS=300"

echo.
"%WX_PY%" "%SCRIPT%" demo --seconds "%SECONDS%" --alert-to 墨墨

echo.
pause
popd
