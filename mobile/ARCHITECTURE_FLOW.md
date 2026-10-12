# 🏗️ Gemini API Architecture Flow

## Before Fix (Not Working ❌)

```
┌─────────────────────────────────────────────────────────┐
│ mobile/src/config/keys.js                               │
│                                                          │
│ export const GEMINI_API_KEYS = [                        │
│   "AQ.Ab8RN6..." // ❌ INVALID KEY                      │
│ ]                                                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ mobile/src/services/recyclingAIService.js               │
│                                                          │
│ import { GEMINI_API_KEYS } from "../config/keys"       │
│                                                          │
│ fetch(GEMINI_URL, {                                     │
│   headers: { "x-goog-api-key": INVALID_KEY }           │
│ })                                                       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
                   ❌ API Call Fails
                   (Invalid API Key)
```

## After Fix (Working ✅)

```
┌─────────────────────────────────────────────────────────┐
│ mobile/.env (gitignored, not in repo)                   │
│                                                          │
│ GEMINI_API_KEY=AIzaSyXXXXX...  ✅ VALID KEY            │
│ GEMINI_API_KEY_2=AIzaSyYYYYY... ✅ VALID KEY           │
│ GEMINI_API_KEY_3=AIzaSyZZZZZ... ✅ VALID KEY           │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ babel.config.js                                          │
│                                                          │
│ plugins: [                                               │
│   ['module:react-native-dotenv', {                      │
│     moduleName: '@env',                                  │
│     path: '.env'                                         │
│   }]                                                     │
│ ]                                                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼ (loads at build time)
┌─────────────────────────────────────────────────────────┐
│ mobile/src/config/keys.js                               │
│                                                          │
│ import { GEMINI_API_KEY, ... } from '@env'              │
│                                                          │
│ export const GEMINI_API_KEYS = [                        │
│   GEMINI_API_KEY,      // ✅ "AIzaSyXXXXX..."          │
│   GEMINI_API_KEY_2,    // ✅ "AIzaSyYYYYY..."          │
│   GEMINI_API_KEY_3     // ✅ "AIzaSyZZZZZ..."          │
│ ]                                                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ mobile/src/services/recyclingAIService.js               │
│                                                          │
│ import { GEMINI_API_KEYS } from "../config/keys"       │
│                                                          │
│ const getNextAvailableKey = () => {                     │
│   // Returns non-rate-limited key                       │
│ }                                                        │
│                                                          │
│ fetch(GEMINI_URL, {                                     │
│   headers: { "x-goog-api-key": VALID_KEY }             │
│ })                                                       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
                   ✅ API Call Succeeds
                   (Valid API Key)
```

## Key Rotation Logic (Rate Limit Handling)

```
User scans waste item
        │
        ▼
┌─────────────────────────────────────────┐
│ getNextAvailableKey()                   │
│                                          │
│ Current: Key 1 (AIzaSyXXX...)           │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Call Gemini API with Key 1              │
└─────────────────────────────────────────┘
        │
        ├──────────── Success ✅ ──────────▶ Return result
        │
        └──── Rate Limit 429 ⚠️
                │
                ▼
        ┌─────────────────────────────────┐
        │ markKeyRateLimited(Key 1)       │
        │ Switch to Key 2                  │
        └─────────────────────────────────┘
                │
                ▼
        ┌─────────────────────────────────┐
        │ Call Gemini API with Key 2      │
        └─────────────────────────────────┘
                │
                ├──── Success ✅ ──────────▶ Return result
                │
                └─── Rate Limit 429 ⚠️
                        │
                        ▼
                ┌─────────────────────────┐
                │ Switch to Key 3         │
                └─────────────────────────┘
                        │
                        ▼
                   And so on...

After 60 seconds, rate-limited keys become available again
```

## Build Process Flow

```
┌────────────────────────────────────────────────────────┐
│ Developer edits mobile/.env with real API keys         │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ npm run build:clean                                     │
│ (Cleans old Android build artifacts)                    │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ npm run start:reset                                     │
│ (Clears Metro bundler cache)                            │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ npm run build:apk                                       │
│                                                          │
│ 1. Babel reads .env via react-native-dotenv            │
│ 2. Injects env vars as static values                   │
│ 3. Metro bundles JavaScript code                       │
│ 4. Gradle builds Android APK                           │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ app-release.apk                                         │
│                                                          │
│ Contains:                                                │
│ - React Native app code                                 │
│ - Bundled JavaScript                                    │
│ - API keys (embedded as static strings)                │
└────────────────────────────────────────────────────────┘
                        │
                        ▼
                Install on phone
                        │
                        ▼
                ✅ App works with
                   valid API keys!
```

## Development vs Production

### Development Mode
```
┌──────────────────┐
│ npm run android  │
└──────────────────┘
         │
         ▼
Metro Bundler (Hot Reload)
         │
         ├─────▶ Reads .env
         │       (every reload)
         │
         ▼
    Phone/Emulator
```

### Production Mode
```
┌─────────────────────┐
│ npm run build:apk   │
└─────────────────────┘
         │
         ▼
Babel processes .env ONCE
         │
         ├─────▶ Bundles into APK
         │       (static values)
         │
         ▼
     app-release.apk
         │
         ▼
    Install on phone
    (no Metro needed)
```

## Security Flow

```
┌────────────────────────────────────────────────────────┐
│ Developer's Machine                                     │
│                                                          │
│ ┌────────────┐           ┌──────────────┐             │
│ │ .env file  │ ────────▶ │ .gitignore   │             │
│ │ (API keys) │           │ (blocks .env)│             │
│ └────────────┘           └──────────────┘             │
│                                  │                      │
│                                  ▼                      │
│                          ❌ Not committed               │
│                             to Git repo                 │
└────────────────────────────────────────────────────────┘
         │
         │ (builds APK locally)
         ▼
┌────────────────────────────────────────────────────────┐
│ app-release.apk                                         │
│ (API keys embedded, but protected by APK obfuscation)  │
└────────────────────────────────────────────────────────┘
         │
         ▼
    End user's phone
    (no access to .env file)
```

## Why This Architecture?

### ✅ Benefits

1. **Secure**: API keys never committed to Git
2. **Flexible**: Change keys without code changes
3. **Scalable**: Easy to add more keys for higher rate limits
4. **Resilient**: Automatic fallback when keys hit limits
5. **Standard**: Uses react-native-dotenv (industry standard)

### ⚠️ Limitations

1. **Client-side keys**: Still embedded in APK (can be extracted)
2. **Rate limits**: Free tier limited to 15 req/min per key
3. **Manual rotation**: Must rebuild APK to change keys

### 🏭 Production Recommendation

For serious production apps, use a **backend proxy**:

```
Mobile App (no API keys)
        │
        ▼
Your Backend Server
(stores API keys securely)
        │
        ▼
Google Gemini API
```

Benefits:
- API keys never in client code
- Implement your own rate limiting
- Add authentication/authorization
- Monitor usage per user
- Easily rotate keys without app updates

---

## Summary

The fix moves API keys from hardcoded source code to environment variables, properly loaded at build time using `react-native-dotenv`. This allows the APK to work in production while keeping keys out of the Git repository.
