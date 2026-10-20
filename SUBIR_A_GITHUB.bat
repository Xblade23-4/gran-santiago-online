@echo off
chcp 65001 > nul
title Subir Gran Santiago Online a GitHub
cd /d "%~dp0"

echo =====================================================================
echo   🚀 PREPARANDO REPOSITORIO PARA SUBIR A GITHUB + RENDER.COM
echo =====================================================================
echo.
echo 1. Primero crea un repositorio vacio en: https://github.com/new
echo    (Por ejemplo, llamalo: gran-santiago-online)
echo.
set /p REPO_URL="2. Pega aqui la URL de tu repositorio (ej: https://github.com/Xblade23-4/gran-santiago-online.git): "

if "%REPO_URL%"=="" (
    echo [!] No ingresaste una URL. Saliendo...
    pause
    exit /b
)

git branch -M main
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo =====================================================================
    echo  ✅ ¡LISTO! Codigo subido a GitHub.
    echo  Ahora entra a https://dashboard.render.com -> "New +" -> "Web Service"
    echo  y selecciona tu repositorio "gran-santiago-online".
    echo =====================================================================
) else (
    echo [!] Hubo un problema al subir. Verifica la URL o tu sesion de GitHub.
)
pause
