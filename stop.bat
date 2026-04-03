@echo off
chcp 65001 >nul
echo ========================================
echo  多模态防诈助手 - 停止脚本
echo ========================================
echo.

REM 停止后端服务器（端口7007）
echo(停止后端服务器（端口7007）...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :7007 ^| findstr LISTENING') do (
    set backend_pid=%%a
)
if defined backend_pid (
    echo 找到后端进程 PID: %backend_pid%
    taskkill /PID %backend_pid% /F >nul 2>nul
    if errorlevel 1 (
        echo 停止后端进程失败。
    ) else (
        echo 后端服务器已停止。
    )
) else (
    echo 未找到运行的后端服务器。
)

REM 停止前端开发服务器（端口8008）
echo(停止前端开发服务器（端口8008）...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8008 ^| findstr LISTENING') do (
    set frontend_pid=%%a
)
if defined frontend_pid (
    echo 找到前端进程 PID: %frontend_pid%
    taskkill /PID %frontend_pid% /F >nul 2>nul
    if errorlevel 1 (
        echo 停止前端进程失败。
    ) else (
        echo 前端开发服务器已停止。
    )
) else (
    echo 未找到运行的前端开发服务器。
)

REM 额外通过窗口标题终止可能遗留的cmd窗口
echo 清理残留的服务器窗口...
taskkill /FI "WINDOWTITLE eq 后端服务器" /F >nul 2>nul
taskkill /FI "WINDOWTITLE eq 前端开发服务器" /F >nul 2>nul

echo.
echo ========================================
echo  所有服务已停止。
echo ========================================
echo.
pause