@echo off
setlocal
cd /d "%~dp0"
node scripts/check-node.mjs
if errorlevel 1 goto end
call npm start
:end
pause
