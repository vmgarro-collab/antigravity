@echo off
set NODE="%LOCALAPPDATA%\ms-playwright-go\1.50.1\node.exe"
if not exist %NODE% (
  echo ERROR: No se encontro node.exe en %NODE%
  echo Por favor instala Node.js desde https://nodejs.org
  pause
  exit /b 1
)
echo Iniciando servidor Benjamines Madrid en http://localhost:8080 ...
cd /d "%~dp0"
%NODE% server.js
