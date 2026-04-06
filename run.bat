@echo off
chcp 65001 >nul
echo ========================================
echo  多模态防诈助手 - 一体化启动脚本
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

REM 检查后端依赖
echo 📦 检查后端依赖...
cd /d "%~dp0backend" 2>nul
if errorlevel 1 (
    echo ❌ 错误：找不到backend目录。
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo ⚠ node_modules不存在，正在安装后端依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 后端依赖安装失败。
        pause
        exit /b 1
    )
    echo ✅ 后端依赖安装成功。
) else (
    echo ✅ 后端依赖已就绪。
)

REM 启动后端服务器（在新窗口中）
echo 🚀 启动后端服务器（端口7007）...
start "后端服务器" cmd /k "node server.js"

REM 等待后端启动
echo ⏳ 等待后端启动（3秒）...
timeout /t 3 /nobreak >nul

REM 检查后端健康状态
echo 🔍 检查后端健康状态...
powershell -Command "$response = Invoke-WebRequest -Uri 'http://localhost:7007/api/health' -Method GET -ErrorAction SilentlyContinue; if ($response.StatusCode -eq 200) { Write-Host '✅ 后端服务正常' } else { Write-Host '❌ 后端服务启动失败'; exit 1 }"
if errorlevel 1 (
    echo ❌ 后端服务启动失败，请检查日志。
    pause
    exit /b 1
)

REM 尝试启动微信采集脚本（可选）
echo 🤖 检查微信采集脚本依赖...
python --version >nul 2>nul
if errorlevel 1 (
    echo ⚠ 未检测到Python，跳过微信采集脚本。
) else (
    echo ✅ 检测到Python。
    cd /d "%~dp0backend" 2>nul
    if exist "wechat_collector.py" (
        echo 📦 检查Python依赖（itchat-uos等）...
        if exist "requirements.txt" (
            echo 🔍 正在安装依赖（请耐心等待）...
            pip install -r requirements.txt
            if errorlevel 1 (
                echo ⚠ Python依赖安装失败，微信采集可能无法工作。
            ) else (
                echo ✅ Python依赖安装成功。
            )
        )
        echo  启动微信消息采集器（新窗口）...
        start "微信采集器" cmd /k "python wechat_collector.py"
    ) else (
        echo ⚠ 未找到 wechat_collector.py，跳过微信采集。
    )
)

REM 切换到前端目录
echo 📂 切换到前端目录...
cd /d "%~dp0frontend" 2>nul
if errorlevel 1 (
    echo ❌ 错误：找不到frontend目录。
    pause
    exit /b 1
)

REM 检查前端依赖
if not exist "node_modules" (
    echo ⚠ node_modules不存在，正在安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 前端依赖安装失败。
        pause
        exit /b 1
    )
    echo ✅ 前端依赖安装成功。
) else (
    echo ✅ 前端依赖已就绪。
)

REM 启动前端开发服务器（在新窗口中）
echo 🌐 启动前端开发服务器（端口8008）...
start "前端开发服务器" cmd /k "npm run dev"

REM 等待前端启动
echo ⏳ 等待前端启动（5秒）...
timeout /t 5 /nobreak >nul

REM 在浏览器中打开应用
echo 🌍 在浏览器中打开应用...
start "" "http://localhost:8008"

echo.
echo ========================================
echo  启动完成！
echo  后端：http://localhost:7007
echo  前端：http://localhost:8008
echo ========================================
echo.
echo 按任意键退出此脚本（服务器将继续运行）...
pause >nul
exit