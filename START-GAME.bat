@echo off
cd /d "%~dp0"
start "Atlas Realms Server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-GAME.ps1"
timeout /t 2 >nul
start "" "http://127.0.0.1:8787"
