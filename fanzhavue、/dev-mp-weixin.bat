@echo off
setlocal EnableExtensions
chcp 65001 >nul

echo ========================================
echo  Anti-Fraud Mini Program - WeChat Dev
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Please install Node.js 18+.
  pause
  exit /b 1
)

cd /d "%~dp0"

set "USE_PM=npm"
where pnpm >nul 2>nul
if not errorlevel 1 set "USE_PM=pnpm"

echo [1/3] Installing or syncing dependencies with %USE_PM%...
call %USE_PM% install
if errorlevel 1 (
  echo [ERROR] Dependency install failed.
  pause
  exit /b 1
)

if exist "scripts\ensure-uni-modules.mjs" (
  echo [2/3] Linking uni_modules...
  set "LINK_UNI_MODULES_FORCE=1"
  call node scripts\ensure-uni-modules.mjs
  if errorlevel 1 (
    echo [ERROR] uni_modules link failed.
    pause
    exit /b 1
  )
) else (
  echo [2/3] scripts\ensure-uni-modules.mjs not found, skipping.
)

echo [3/3] Starting WeChat mini program watcher...
echo Output: %CD%\dist\dev\mp-weixin
echo Import that output folder in WeChat DevTools.
echo Press Ctrl+C to stop.
echo ----------------------------------------
call %USE_PM% run dev:mp-weixin
if errorlevel 1 (
  echo [ERROR] WeChat mini program watcher failed.
  pause
  exit /b 1
)

pause
exit /b 0
