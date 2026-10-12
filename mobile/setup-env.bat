@echo off
REM BinGo - Environment Setup Script (Windows)
REM This script installs required packages for environment variable support

echo Setting up environment variables for BinGo Mobile...
echo.

REM Check if we're in the mobile directory
if not exist "package.json" (
  echo Error: package.json not found. Please run this script from the mobile\ directory.
  exit /b 1
)

REM Install react-native-dotenv
echo Installing react-native-dotenv...
call npm install --save-dev react-native-dotenv

REM Check if .env exists
if not exist ".env" (
  echo.
  echo .env file not found!
  echo Copying .env.example to .env...
  copy .env.example .env
  echo.
  echo .env file created!
  echo.
  echo IMPORTANT: You need to add your real Gemini API keys to .env
  echo.
  echo Steps:
  echo 1. Go to https://aistudio.google.com/app/apikey
  echo 2. Sign in and create 2-3 API keys
  echo 3. Copy the keys (they start with 'AIza'^)
  echo 4. Edit mobile\.env and replace the placeholder values
  echo.
) else (
  echo .env file already exists
)

REM Clean cache to ensure babel picks up the new config
echo.
echo Cleaning Metro bundler cache...
call npx react-native start --reset-cache

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Edit mobile\.env with your real Gemini API keys
echo 2. Clean the Android build: cd android ^&^& gradlew clean ^&^& cd ..
echo 3. Rebuild your APK: npm run android -- --mode=release
echo.

pause
