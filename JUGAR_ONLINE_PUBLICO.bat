@echo off
chcp 65001 > nul
title Gran Santiago Online - Publicar en Internet al Instante
cd /d "%~dp0"

echo =====================================================================
echo   🌐 GRAN SANTIAGO ONLINE - MODO INTERNET PUBLICO INSTANTANEO
echo =====================================================================
echo.
echo 1. Asegurando que el servidor de Gran Santiago este corriendo en el puerto 3000...
netstat -ano | findstr :3000 > nul
if %ERRORLEVEL% neq 0 (
    start "Gran Santiago Server" cmd /c "node server.js"
    timeout /t 2 /nobreak > nul
)

echo 2. Creando enlace publico HTTPS para que entre cualquier persona...
echo    (Copia la URL que termina en .lhr.life o .localhost.run y pasala a tus amigos)
echo =====================================================================
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:3000 nokey@localhost.run
pause
