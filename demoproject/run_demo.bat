@echo off
title VibeShop Demo Microservice
echo ===================================================
echo   Starting VibeShop Demo Microservice
echo   Local Address: http://localhost:5000
echo ===================================================
echo.
cd /d "%~dp0"
python app.py
pause
