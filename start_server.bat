@echo off
title Smart Clipper Server
echo ===================================================
echo           STARTING SMART CLIPPER SERVER            
echo ===================================================
echo.
cd /d "%~dp0"

if not exist venv\Scripts\python.exe (
    echo Error: Virtual environment not found in %CD%\venv
    pause
    exit /b 1
)

echo Activating environment and starting server on http://127.0.0.1:8000 ...
echo Press Ctrl+C in this window to stop the server.
echo.

venv\Scripts\python.exe -m uvicorn backend.main:app --port 8000 --reload
pause
