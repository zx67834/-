@echo off
chcp 65001 >nul
echo ========================================
echo  多模态防诈助手 - 依赖检查与安装工具
echo ========================================
echo.

REM 检查是否已安装Node.js
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ 错误：未检测到Node.js。
    echo 请从 https://nodejs.org/ 下载并安装Node.js 18+。
    pause
    exit /b 1
)

REM 检查是否已安装npm
where npm >nul 2>nul
if errorlevel 1 (
    echo ❌ 错误：未检测到npm（Node.js包管理器）。
    echo 请确保Node.js安装正确，npm应随Node.js一同安装。
    pause
    exit /b 1
)

REM 显示版本信息
echo ✅ 已检测到Node.js和npm。
node --version
npm --version
echo.

REM 切换到frontend目录（如果存在）
cd /d "%~dp0frontend" 2>nul
if errorlevel 1 (
    echo ❌ 错误：找不到frontend目录，请确保项目结构完整。
    pause
    exit /b 1
)

REM 检查package.json是否存在
if not exist "package.json" (
    echo ❌ 错误：package.json不存在，无法安装依赖。
    pause
    exit /b 1
)

REM 询问是否安装依赖
set /p choice="是否安装/更新依赖？(Y/N, 默认Y): "
if /i "%choice%"=="N" (
    echo 跳过依赖安装。
    goto :skipinstall
)

echo.
echo 📦 正在安装依赖（这可能需要几分钟）...
call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败，请检查网络或package.json配置。
    pause
    exit /b 1
) else (
    echo ✅ 依赖安装成功！
)

:skipinstall
echo.
echo ========================================
echo  依赖检查完成
echo ========================================
echo 前端依赖状态：
if exist "node_modules" (
    echo ✅ node_modules 目录存在。
) else (
    echo ⚠ node_modules 目录不存在，请运行 npm install。
)
echo.
echo 按任意键退出...
pause >nul