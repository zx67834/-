@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

echo ========================================
echo  Anti-Fraud App - Stop Services
echo ========================================
echo.

call :kill_port 8008 "frontend"
call :kill_port 7007 "backend"

echo.
echo [OK] Stop command finished.
pause
exit /b 0

:kill_port
set "PORT=%~1"
set "NAME=%~2"
set "FOUND=0"

echo Stopping %NAME% on port %PORT%...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
  set "FOUND=1"
  echo Found PID %%P
  taskkill /PID %%P /F >nul 2>nul
  if errorlevel 1 (
    echo [WARN] Failed to stop PID %%P. Try running this script as administrator.
  ) else (
    echo [OK] Stopped PID %%P
  )
)

if "%FOUND%"=="0" (
  echo [OK] No %NAME% service found on port %PORT%.
)
exit /b 0
