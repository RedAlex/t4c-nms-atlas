@echo off
REM Script de build et lancement pour Atlas NMS Revolution
REM Peut être exécuté depuis n'importe quel répertoire

REM Obtenir le répertoire du script
cd /d "%~dp0"

echo Fermeture des instances existantes...
taskkill /IM "Atlas NMS Revolution.exe" /F 2>nul
taskkill /IM "electron.exe" /F 2>nul
timeout /t 1 /nobreak

echo Lancement du build...
call npm.cmd run build:win

if %errorlevel% equ 0 (
    echo Build réussi ! Lancement de l'application...
    start "" ".\release\Atlas NMS Revolution-win32-x64\Atlas NMS Revolution.exe"
) else (
    echo Erreur lors du build !
    exit /b 1
)
