@echo off
REM Start the API server in background
echo Starting API server...
start "TrackTime API Server" node dist/index.js

REM Wait for server to start
timeout /t 3 /nobreak

REM Run tests
echo Running tests...
node --test tests/auth.integration.test.mjs

REM Kill the server window (optional)
taskkill /FI "WINDOWTITLE eq TrackTime API Server" /T /F 2>nul
