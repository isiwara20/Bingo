# 🔧 Quick Fix: Gemini API Not Working in APK

## The Problem
Your Gemini API keys aren't working in the production APK because:
1. ❌ The keys in your code are **invalid** (should start with "AIza", not "AQ.Ab8RN6...")
2. ❌ Environment variables aren't properly loaded in production builds
3. ❌ Missing `react-native-dotenv` package

## ✅ Quick Fix (5 Minutes)

### Step 1: Install Required Package
```bash
cd mobile
npm install --save-dev react-native-dotenv
```

### Step 2: Get Real Gemini API Keys
1. Go to: **https://aistudio.google.com/app/apikey**
2. Sign in with Google
3. Click "Create API Key"
4. Copy 2-3 keys (for rate limit backup)
5. Keys should look like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` (starts with "AIza")

### Step 3: Update Your .env File
Edit `mobile/.env` and replace with your **real keys**:

```env
API_BASE_URL=https://bingo-backend-2zmk.onrender.com/api/v1

# Replace these with YOUR ACTUAL KEYS from Google AI Studio
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GEMINI_API_KEY_2=AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
GEMINI_API_KEY_3=AIzaSyZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ
```

### Step 4: Clean & Rebuild APK
```bash
# Clean old builds
cd android
./gradlew clean
cd ..

# Rebuild APK
npm run android -- --mode=release
```

Your new APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Step 5: Install & Test
```bash
# Install on connected phone
adb install android/app/build/outputs/apk/release/app-release.apk

# Test the Gemini features:
# - Open "Scan Waste" screen
# - Take/select a photo
# - AI should analyze it
```

## 🧪 Testing
If it still doesn't work, check logs:
```bash
adb logcat | grep -i gemini
```

## ⚠️ Important Notes
- **Free Tier Limits**: 15 requests/minute per key (that's why we use 3 keys)
- **Never commit**: Your `.env` file is already in `.gitignore` - never commit it!
- **Security**: For production apps, use a backend proxy instead of client-side API keys

## 📁 What Changed
I've updated these files for you:
- ✅ `mobile/src/config/keys.js` - Now loads from environment variables
- ✅ `mobile/babel.config.js` - Added dotenv plugin
- ✅ `mobile/.env` - Template for your API keys
- ✅ `mobile/.env.example` - Updated example file

## 🎯 Summary
The root cause was **invalid API keys** hardcoded in the source. Now the app:
1. Loads keys from `.env` file
2. Validates they start with "AIza"
3. Supports multiple keys with automatic fallback
4. Works properly in production APK builds

Once you add your real Gemini API keys to `.env` and rebuild the APK, everything should work! 🚀
