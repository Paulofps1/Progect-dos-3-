@echo off
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
if not exist ".env" (
  echo.
  echo Falta o arquivo .env nesta pasta.
  echo Copie o .env que veio no zip do Nutri AI para ca e rode de novo.
  echo.
  pause
  exit /b 1
)
if not exist "node_modules" call npm install
start "" http://localhost:8080/
npm run dev
