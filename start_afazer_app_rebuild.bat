@echo off

REM Clear old dist build to avoid version mismatches
if exist dist (
    rmdir /s /q dist
)

REM Clear local Expo/Metro caches that can keep stale env values
if exist .expo (
    rmdir /s /q .expo
)
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
)

REM Clear session environment variables so Expo reads fresh values from .env
set EXPO_PUBLIC_API_URL=
set EXPO_API_URL=
set NODE_ENV=
set USE_HTTPS=
set EAS_PROJECT_ID=

REM Export the Expo web app with a clean Expo/Metro cache
npx expo export --platform web --clear

REM Serve the web build from dist directory
start /b npx serve -s dist -l 3000

REM Open the browser
timeout /t 3 /nobreak
start http://localhost:3000

REM Keep window open
pause