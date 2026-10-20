@echo off
title Gran Santiago Online - Servidor Multijugador
cd /d "%~dp0"
echo =========================================================
echo   GRAN SANTIAGO ONLINE (2 a 8 Jugadores - Economia CLP)
echo =========================================================
echo Iniciando servidor en http://localhost:3000 ...
start "" "http://localhost:3000"
node server.js
pause
