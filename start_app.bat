@echo off
echo ===========================================
echo       Starting InboxIQ AI Assistant
echo ===========================================

echo [1/3] Starting Backend Server...
cd server
:: Start server in a new independent window
start "InboxIQ Server" cmd /k "npm run dev"
cd ..

echo [2/3] Waiting for Server to initialize...
timeout /t 5 /nobreak >nul

echo [3/3] Starting Frontend Client...
cd client
:: Start client in a new independent window
start "InboxIQ Client" cmd /k "npm run dev"
cd ..

echo.
echo ===========================================
echo       App is Running!
echo ===========================================
echo Opening browser...
timeout /t 3 /nobreak >nul
start http://localhost:5173

pause
