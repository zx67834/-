@echo off
chcp 65001 >nul
REM Compatibility entry point. The main launcher is run-all-model.bat.
call "%~dp0run-all-model.bat"
