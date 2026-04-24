@echo off
cd /d %~dp0
echo Cerrando instancia anterior si existe...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :8765') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 1 /nobreak > nul
echo Iniciando AIgor...
start "" python core/main.py
timeout /t 3 /nobreak > nul
start http://localhost:8765
