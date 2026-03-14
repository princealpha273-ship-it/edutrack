@echo off
cd /d C:\EduTrack
set PATH=C:\Program Files\nodejs;%PATH%

echo ========================================
echo    EduTrack School Management System
echo ========================================
echo.
echo Starting server...

start /b npx next dev -p 3000 > nul 2>&1

echo Waiting for server to start...
timeout /t 10 /nobreak > nul

echo Opening browser...
start http://localhost:3000

echo.
echo If browser didn't open, go to: http://localhost:3000
echo.
pause
