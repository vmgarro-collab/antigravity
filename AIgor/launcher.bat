@echo off
cd /d %~dp0
echo Iniciando AIgor...
start "" python core/main.py
timeout /t 3 /nobreak > nul
start http://localhost:8765
