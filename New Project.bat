@echo off
rem Double-click to create a new project from this starter, next to the starter's own folder.
setlocal
set /p NAME=Project name:
if "%NAME%"=="" exit /b 1
set /p DESC=One line on what it is for (optional):
node "%~dp0tools\new-project.mjs" "%~dp0..\%NAME%" --name "%NAME%" --desc "%DESC%" --git
echo.
pause
