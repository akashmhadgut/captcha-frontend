@echo off
echo Initializing git...
git init

echo Removing cached files (if any)...
git rm -r --cached node_modules 2>nul
git rm -r --cached .env 2>nul

echo Adding files...
git add .
git add vercel.json

echo Committing...
git commit -m "Prepare frontend for deployment: React App with Vercel config"

echo Setup remote...
git remote remove origin 2>nul
git remote add origin https://github.com/akashmhadgut/captcha-frontend.git

echo Pushing...
git branch -M main
git push -u origin main
