@echo off
chcp 65001 >nul
setlocal

echo ========================================
echo  uni-app 微信小程序 - 安装依赖并启动编译
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请安装 18+：https://nodejs.org/
    pause
    exit /b 1
)

set "MP_DIR=%~dp0fanzhavue、"
cd /d "%MP_DIR%" 2>nul
if errorlevel 1 (
    echo [错误] 无法进入目录："%MP_DIR%"
    echo 请确认本 bat 与「fanzhavue、」文件夹在同一级目录下。
    pause
    exit /b 1
)

set "USE_PM=npm"
where pnpm >nul 2>nul
if not errorlevel 1 set "USE_PM=pnpm"

echo [1/3] 安装 / 同步依赖（%USE_PM%）...
call %USE_PM% install
if errorlevel 1 (
    echo [错误] 依赖安装失败。
    pause
    exit /b 1
)
echo.

echo [2/3] 链接 uni_modules（复制项目后必做，避免 @/uni_modules 找不到）...
set "LINK_UNI_MODULES_FORCE=1"
call node scripts\ensure-uni-modules.mjs
echo.

echo [3/3] 启动微信小程序开发编译（监听文件变化）...
echo.
echo Output: %CD%\dist\dev\mp-weixin
echo Open WeChat DevTools and import this folder.
echo Stop watcher: press Ctrl+C in this window.
echo ----------------------------------------
echo.

call %USE_PM% run dev:mp-weixin
if errorlevel 1 (
    echo [错误] 启动失败，请查看上方日志。
    pause
    exit /b 1
)

pause
endlocal
