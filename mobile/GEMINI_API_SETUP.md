# Gemini API Keys Setup Guide

## Problem
Your Gemini API keys aren't working in the production APK because:
1. The API keys you have are invalid (they should start with "AIza")
2. Environment variables aren't properly configured for production builds

## Solution Steps

### Step 1: Get Valid Gemini API Keys

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy the key (it should start with "AIza" and be ~39 characters long)
5. Create 2-3 keys for redundancy (rate limit fallback)

### Step 2: Install react-native-dotenv

```bash
cd mobile
npm install --save-dev react-native-dotenv
```

### Step 3: Update Your .env File

Edit `mobile/.env` and add your REAL Gemini API keys:

```env
# Backend API Base URL (Production - Render)
API_BASE_URL=https://bingo-backend-2zmk.onrender.com/api/v1

# Gemini AI API Keys (Get from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GEMINI_API_KEY_2=AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
GEMINI_API_KEY_3=AIzaSyZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ
```

### Step 4: Update babel.config.js

Add the dotenv plugin to your `babel.config.js`:

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
      safe: false,
      allowUndefined: true,
    }],
    'react-native-reanimated/plugin',
  ],
};
```

### Step 5: Create .env.d.ts for TypeScript Support (Optional)

If using TypeScript, create `mobile/.env.d.ts`:

```typescript
declare module '@env' {
  export const API_BASE_URL: string;
  export const GEMINI_API_KEY: string;
  export const GEMINI_API_KEY_2: string;
  export const GEMINI_API_KEY_3: string;
}
```

### Step 6: Rebuild Your APK

```bash
cd mobile/android
./gradlew clean
cd ..
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle
cd android
./gradlew assembleRelease
```

Or use the simpler command:
```bash
cd mobile
npm run android -- --mode=release
```

Your APK will be at: `mobile/android/app/build/outputs/apk/release/app-release.apk`

### Step 7: Test the APK

Install the new APK on your phone and test the Gemini features (waste scanning, recycling guide).

## Verification

After installing, try:
1. Opening the "Scan Waste" feature
2. Taking a photo or selecting an image
3. The AI should analyze it and return results

If it still doesn't work, check the Metro bundler logs or device logs:
```bash
adb logcat | grep -i gemini
```

## Important Notes

- **NEVER commit your .env file with real API keys to Git**
- The .env file should already be in .gitignore
- For production apps, consider using a backend proxy to hide API keys
- Free tier Gemini API has rate limits (15 requests/minute)
- That's why we support multiple keys with automatic fallback
