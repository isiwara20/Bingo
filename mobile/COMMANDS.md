# 📝 Quick Command Reference

## Initial Setup (Do Once)

```bash
# Navigate to mobile folder
cd mobile

# Install dependencies (already done for you)
npm install

# Copy example env file (if needed)
cp .env.example .env

# Edit .env with your real API keys
# Use your favorite editor (notepad, vim, code, etc.)
notepad .env        # Windows
nano .env           # Linux/Mac
code .env           # VS Code
```

---

## Testing API Keys

```bash
# Test if your Gemini API keys are valid
npm run test:keys
```

Expected output:
```
✅ Valid keys: 3/3
🎉 All keys are valid! Your app is ready to use.
```

---

## Development Commands

```bash
# Start Metro bundler
npm start

# Start with cache cleared (recommended after .env changes)
npm run start:reset

# Run on Android (debug mode)
npm run android

# Run on Android (release mode - closer to production)
npm run android:release

# Run tests
npm test

# Lint code
npm run lint
```

---

## Building Release APK

```bash
# Method 1: All-in-one command
npm run build:apk

# Method 2: Step by step (recommended)
npm run build:clean           # Clean old builds
npm run start:reset           # Clear Metro cache (Ctrl+C after it starts)
npm run build:apk             # Build APK

# Method 3: Manual (for troubleshooting)
cd android
./gradlew clean               # Clean
./gradlew assembleRelease     # Build
cd ..
```

APK location after build:
```
mobile/android/app/build/outputs/apk/release/app-release.apk
```

---

## Installing APK on Phone

```bash
# Method 1: Using npm script (easiest)
npm run install:apk

# Method 2: Using adb directly
adb install android/app/build/outputs/apk/release/app-release.apk

# Method 3: Manual
# Copy app-release.apk to phone and open it
```

---

## Troubleshooting Commands

```bash
# Check if phone is connected
adb devices

# View app logs
adb logcat | grep -i bingo
adb logcat | grep -i gemini

# Clear app data
adb shell pm clear com.bingo

# Uninstall app
adb uninstall com.bingo

# View build info
cd android
./gradlew --version
./gradlew tasks
cd ..

# Check environment variables (for debugging)
# Windows
type .env
# Linux/Mac
cat .env

# Reset everything (nuclear option)
cd mobile
rm -rf node_modules android/build android/app/build
# or on Windows: rmdir /s /q node_modules android\build android\app\build
npm install
npm run build:clean
npm run start:reset
npm run build:apk
```

---

## Git Commands (Safe)

```bash
# Check what would be committed
git status

# .env should NOT appear in the list (it's gitignored)
# If it does appear, DO NOT COMMIT!

# Safe commits (after verifying .env is not in git status)
git add .
git commit -m "Fixed Gemini API configuration"
git push
```

**⚠️ CRITICAL**: Never commit `.env` file with real API keys!

---

## Environment File Locations

```
Development:
mobile/.env                    # Your keys here (gitignored)
mobile/.env.example            # Template (committed to Git)

Configuration:
mobile/babel.config.js         # Loads .env
mobile/src/config/keys.js      # Exports keys from @env

Usage:
mobile/src/services/recyclingAIService.js    # Uses keys
```

---

## Useful Android Commands

```bash
# Enable USB debugging on phone first!
# Settings → About Phone → Tap "Build Number" 7 times
# Settings → Developer Options → Enable "USB Debugging"

# Reverse port (for local backend testing)
adb reverse tcp:5000 tcp:5000

# View app info
adb shell dumpsys package com.bingo | grep version

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png

# Record screen
adb shell screenrecord /sdcard/demo.mp4
# (Ctrl+C to stop)
adb pull /sdcard/demo.mp4

# View storage
adb shell df -h
```

---

## Package Management

```bash
# Update all dependencies
npm update

# Install specific package
npm install package-name

# Remove package
npm uninstall package-name

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities (safe)
npm audit fix

# Check outdated packages
npm outdated
```

---

## React Native Specific

```bash
# Clear all caches (when things are broken)
npx react-native start --reset-cache
cd android
./gradlew clean
cd ..
rm -rf $TMPDIR/react-*    # Mac/Linux
# or manually clear C:\Users\YourUser\AppData\Local\Temp\react-* on Windows

# Info about RN installation
npx react-native info

# Doctor command (checks environment)
npx react-native doctor

# Link assets (if needed)
npx react-native-asset
```

---

## Quick Workflow

### First Time Setup
```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with real API keys
npm run test:keys          # Verify keys work
npm run build:apk          # Build APK
npm run install:apk        # Install on phone
```

### After Code Changes
```bash
cd mobile
npm run build:clean
npm run build:apk
npm run install:apk
```

### After .env Changes
```bash
cd mobile
npm run start:reset        # Ctrl+C after it starts
npm run build:apk
npm run install:apk
```

### Quick Test in Development
```bash
cd mobile
npm start                  # Terminal 1 (keep running)
npm run android            # Terminal 2 (builds and installs)
```

---

## Common Issues & Solutions

### "Cannot find module '@env'"
```bash
npm install --save-dev react-native-dotenv
npm run start:reset
```

### "Invalid API key" errors
```bash
npm run test:keys          # Check if keys are valid
# Edit .env with correct keys (must start with "AIza")
npm run start:reset
npm run build:apk
```

### App crashes on startup
```bash
adb logcat | grep -E "(ERROR|FATAL)"
# Look for error messages
```

### Build failures
```bash
cd android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npm run build:apk
```

### Metro bundler issues
```bash
# Kill all node processes
# Windows
taskkill /F /IM node.exe
# Linux/Mac
killall node

# Restart Metro
npm run start:reset
```

---

## Performance Tips

```bash
# Build with ProGuard (smaller APK, harder to reverse engineer)
cd android
./gradlew assembleRelease --no-daemon --parallel
cd ..

# Check APK size
# Windows
dir android\app\build\outputs\apk\release\app-release.apk
# Linux/Mac
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Analyze APK contents
cd android
./gradlew assembleRelease
./gradlew analyzeReleaseApk
cd ..
```

---

## Helpful npm Scripts (Summary)

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run start:reset` | Start Metro with cache cleared |
| `npm run android` | Run app on Android (debug) |
| `npm run android:release` | Run app on Android (release) |
| `npm test` | Run tests |
| `npm run test:keys` | Test Gemini API keys |
| `npm run lint` | Check code quality |
| `npm run build:clean` | Clean Android build |
| `npm run build:apk` | Build release APK |
| `npm run install:apk` | Install APK on connected device |

---

## Where to Get Help

- **Gemini API Keys**: https://aistudio.google.com/app/apikey
- **React Native Docs**: https://reactnative.dev/docs/getting-started
- **react-native-dotenv**: https://github.com/goatandsheep/react-native-dotenv
- **Project Docs**: See `docs/` folder in repo root

---

## Emergency Reset

If everything is broken and you want to start fresh:

```bash
cd mobile

# 1. Clean everything
rm -rf node_modules android/build android/app/build .metro-cache
# Windows: rmdir /s /q node_modules android\build android\app\build .metro-cache

# 2. Reinstall
npm install

# 3. Verify .env has real API keys
cat .env                    # or type .env on Windows

# 4. Test keys
npm run test:keys

# 5. Build fresh
npm run build:clean
npm run start:reset         # Ctrl+C after starts
npm run build:apk

# 6. Install
npm run install:apk
```

This should fix 99% of issues!
