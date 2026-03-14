@echo off
echo Pushing to GitHub...
cd /d C:\EduTrack
git add -A
git commit -m "Prepare for Vercel deployment"
git push origin main
echo.
echo Done! Now go to https://vercel.com to deploy.
pause
