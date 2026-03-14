@echo off
cd /d C:\EduTrack
set PATH=C:\Program Files\nodejs;%PATH%
echo Starting EduTrack...
echo.
echo Once ready, open your browser to:
echo http://localhost:3000
echo.
npx next dev -p 3000
pause
