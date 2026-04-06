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

REM 检查Node.js版本是否符合要求（>=18）
for /f "tokens=*" %%i in ('node --version') do set node_version=%%i
REM 移除前缀'v'
set node_version=%node_version:v=%
for /f "tokens=1,2,3 delims=." %%a in ("%node_version%") do (
    set major=%%a
    set minor=%%b
    set patch=%%c
)
if %major% LSS 18 (
    echo ❌ 错误：Node.js 版本 %node_version% 低于要求版本 18+。
    echo 请升级到 Node.js 18 或更高版本。
    pause
    exit /b 1
)
echo ✅ Node.js 版本 %node_version% 符合要求。
echo 版本检查通过。
echo.

REM 设置项目目录列表（前端和后端）
set project_dirs=frontend backend
echo 项目目录: %project_dirs%

for %%d in (%project_dirs%) do (
    echo ========================================
    echo  正在检查 %%d 目录...
    echo ========================================
    echo.

    REM 切换到目录
    cd /d "%~dp0%%d" 2>nul
    if errorlevel 1 (
        echo ❌ 错误：找不到 %%d 目录，请确保项目结构完整。
        echo.
        goto :nextdir
    )

    REM 检查package.json是否存在
    if not exist "package.json" (
        echo ❌ 错误：package.json不存在，无法检查依赖。
        echo.
        goto :nextdir
    )

    echo ✅ 进入 %%d 目录，正在检查依赖状态...
    echo.

    REM 检查node_modules是否存在
    if exist "node_modules" (
        echo 📦 node_modules 目录已存在。
        REM 运行 npm outdated 检查是否有过时的包
        echo 🔍 正在检查过时的依赖包...
        call npm outdated --silent
        if errorlevel 1 (
            echo ⚠ 发现过时的依赖包。
            echo.
            set /p choice="是否更新过时的依赖？(Y/N, 默认Y): "
            if /i "%choice%"=="N" (
                echo 跳过依赖更新。
            ) else (
                echo 📦 正在更新依赖...
                call npm update
                if errorlevel 1 (
                    echo ❌ 依赖更新失败，请检查网络或配置。
                    pause
                    exit /b 1
                ) else (
                    echo ✅ 依赖更新成功！
                )
            )
        ) else (
            echo ✅ 所有依赖均为最新版本。
        )
    ) else (
        echo ⚠ node_modules 目录不存在，将安装依赖。
        set /p choice="是否安装依赖？(Y/N, 默认Y): "
        if /i "%choice%"=="N" (
            echo 跳过依赖安装。
        ) else (
            echo 📦 正在安装依赖（这可能需要几分钟）...
            call npm install
            if errorlevel 1 (
                echo ❌ 依赖安装失败，请检查网络或package.json配置。
                pause
                exit /b 1
            ) else (
                echo ✅ 依赖安装成功！
            )
        )
    )

    echo.
    echo %%d 依赖检查完成。
    echo.

    :nextdir
    REM 返回上级目录
    cd /d "%~dp0"
)

REM ==================== Python依赖检查 ====================
echo.
echo ========================================
echo  Python依赖检查（微信采集）
echo ========================================
echo.

python --version >nul 2>nul
if errorlevel 1 (
    echo ⚠ 未检测到Python，微信采集功能将不可用。
) else (
    echo ✅ 检测到Python。
    REM 检查是否已安装必要包
    cd /d "%~dp0backend" 2>nul
    if exist "requirements.txt" (
        echo 🔍 检查 requirements.txt 中的依赖...
        pip list --format=freeze > "%temp%\installed.txt" 2>nul
        for /f "delims==" %%p in (requirements.txt) do (
            set "pkg=%%p"
            setlocal enabledelayedexpansion
            REM 提取包名（忽略版本号）
            for /f "tokens=1 delims=>=" %%i in ("!pkg!") do set "pkgname=%%i"
            REM 检查是否已安装
            findstr /i "!pkgname!" "%temp%\installed.txt" >nul
            if errorlevel 1 (
                echo ❌ 缺少依赖: !pkgname!
                set /p choice="是否安装缺失的Python依赖？(Y/N, 默认Y): "
                if /i "!choice!"=="N" (
                    echo 跳过安装。
                ) else (
                    echo 📦 正在安装 !pkgname! ...
                    pip install "!pkgname!"
                    if errorlevel 1 (
                        echo ❌ 安装失败。
                    ) else (
                        echo ✅ 安装成功。
                    )
                )
            ) else (
                echo ✅ !pkgname! 已安装。
            )
            endlocal
        )
        del "%temp%\installed.txt" 2>nul
    ) else (
        echo ⚠ 未找到 requirements.txt，跳过Python依赖检查。
    )
    cd /d "%~dp0"
)

echo ========================================
echo  所有依赖检查完成
echo ========================================
echo.
echo 按任意键退出...
pause >nul