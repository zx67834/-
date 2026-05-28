@echo off
setlocal EnableExtensions
chcp 65001 >nul

pushd "%~dp0"

echo ========================================
echo  Anti-Fraud WeChat Auto - Stop
echo ========================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-wechat-auto.ps1"

echo.
echo [OK] Stop command finished.
pause
popd
exit /b 0
