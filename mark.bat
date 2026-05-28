@echo off
setlocal EnableExtensions
chcp 65001 >nul

pushd "%~dp0"
set "BACKEND_DIR=backend"
set "FRONTEND_DIR=frontend"

echo ========================================
echo  Anti-Fraud App - Dependency Check
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

echo Node:
node --version
echo npm:
call npm --version
echo.

call :install_if_needed "%BACKEND_DIR%" "backend"
if errorlevel 1 exit /b 1

call :install_if_needed "%FRONTEND_DIR%" "frontend"
if errorlevel 1 exit /b 1

echo.
echo [OK] Dependency check finished.
popd
pause
exit /b 0

:install_if_needed
set "TARGET_DIR=%~1"
set "LABEL=%~2"

if not exist "%TARGET_DIR%\package.json" (
  echo [ERROR] Missing %LABEL% package.json: %TARGET_DIR%
  pause
  exit /b 1
)

if exist "%TARGET_DIR%\node_modules" (
  echo [OK] %LABEL% dependencies are already installed.
  exit /b 0
)

echo Installing %LABEL% dependencies...
pushd "%TARGET_DIR%"
call npm install
set "NPM_EXIT=%ERRORLEVEL%"
popd

if not "%NPM_EXIT%"=="0" (
  echo [ERROR] Failed to install %LABEL% dependencies.
  pause
  exit /b 1
)

echo [OK] %LABEL% dependencies installed.
exit /b 0
