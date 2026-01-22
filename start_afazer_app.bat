@echo off

REM Clear old dist build to avoid version mismatches
if exist dist (
    rmdir /s /q dist
)

REM Export the Expo web app with current dependencies
npx expo export --platform web

REM Serve the web build from dist directory
start /b npx serve -s dist -l 3000

REM Open the browser
timeout /t 3 /nobreak
start http://localhost:3000

REM Keep window open
pause