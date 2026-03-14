@echo off
title EduTrack Setup
color 0a

echo ========================================
echo    EduTrack - School Management System
echo ========================================
echo.

echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js is NOT installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org
    echo 2. Download and install LTS version
    echo 3. Restart this command prompt
    echo 4. Run this file again
    echo.
    pause
    exit /b 1
)

echo Node.js is installed!
echo.

echo [2/5] Installing dependencies...
npm install
if errorlevel 1 (
    echo Failed to install dependencies!
    pause
    exit /b 1
)
echo Done!
echo.

echo [3/5] Generating Prisma client...
npx prisma generate
echo Done!
echo.

echo [4/5] Creating database...
npx prisma db push
echo Done!
echo.

echo [5/5] Seeding demo data...
node prisma\seed.js
echo Done!
echo.

echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Starting EduTrack...
echo.
echo Open your browser and go to:
echo http://localhost:3000
echo.
echo Login Credentials:
echo ----------------------
echo Platform Admin: admin@edutrack.com / password123
echo School Admin:   admin@mukiria.ac.ke / password123
echo Teacher:        teacher@mukiria.ac.ke / password123
echo Student:        student@mukiria.ac.ke / password123
echo.
echo ========================================
echo.

npm run dev

pause
