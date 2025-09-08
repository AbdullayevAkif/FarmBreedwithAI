@echo off
echo Installing dependencies...
call npm install

echo.
echo Starting frontend development server...
echo Make sure your backend is running on port 8123
echo.
call npm start

