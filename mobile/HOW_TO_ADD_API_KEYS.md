# 🔑 How to Add Your Gemini API Keys

## The Error You're Seeing

```
❌ Uncaught Error
No valid Gemini API keys found! Please add your API keys to
mobile/.env file. Get keys from: https://aistudio.google.com/app/apikey
```

This error appears because your `.env` file has placeholder text instead of real API keys.

---

## ✅ Fix It in 3 Minutes

### Step 1: Get Your API Key (2 minutes)

1. **Open this URL in your browser:**
   ```
   https://aistudio.google.com/app/apikey
   ```

2. **Sign in** with your Google account

3. **Click the button** that says:
   - "Create API Key" or
   - "Get API Key" or  
   - "+ Create API Key in new project"

4. **Copy the key** - it will look like:
   ```
   AIzaSyDh4qF5Xx-XxXxXxXxXxXxXxXxXxXxXxX
   ```
   
   ✅ Key should START with: `AIza`  
   ✅ Key should be about 39 characters long  
   ❌ NOT like: `AQ.Ab8RN6...` (this is invalid!)

5. **Optional**: Create 2-3 keys for better performance (prevents rate limiting)

---

### Step 2: Add Key to .env File (1 minute)

#### Option A: Using a Text Editor

1. **Open the file** `mobile/.env` in any text editor:
   - Windows: `notepad mobile\.env`
   - Mac/Linux: `nano mobile/.env`
   - VS Code: `code mobile/.env`

2. **Find these lines:**
   ```env
   GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE
   GEMINI_API_KEY_2=YOUR_SECOND_GEMINI_API_KEY_HERE
   GEMINI_API_KEY_3=YOUR_THIRD_GEMINI_API_KEY_HERE
   ```

3. **Replace the placeholder with your real key:**
   ```env
   GEMINI_API_KEY=AIzaSyDh4qF5Xx-XxXxXxXxXxXxXxXxXxXxXxX
   GEMINI_API_KEY_2=YOUR_SECOND_GEMINI_API_KEY_HERE
   GEMINI_API_KEY_3=YOUR_THIRD_GEMINI_API_KEY_HERE
   ```
   
   💡 You can leave GEMINI_API_KEY_2 and GEMINI_API_KEY_3 as placeholders if you only have 1 key

4. **Save the file**

#### Option B: Copy-Paste Template

Replace the entire Gemini section in `mobile/.env` with this:

```env
# Gemini AI API Keys
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GEMINI_API_KEY_2=AIzaSyYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
GEMINI_API_KEY_3=AIzaSyZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ
```

Then replace the `XXX`, `YYY`, `ZZZ` parts with your actual key characters.

---

### Step 3: Rebuild and Test

After adding your real API keys:

```bash
cd mobile

# Test if keys are valid
npm run test:keys

# If test passes ✅, rebuild:
npm run build:clean
npm run build:apk

# Install on phone
npm run install:apk
```

---

## 📝 Example

### ❌ WRONG (This Won't Work):
```env
GEMINI_API_KEY=YOUR_ACTUAL_GEMINI_API_KEY_HERE
```

### ✅ CORRECT (This Will Work):
```env
GEMINI_API_KEY=AIzaSyDh4qF5Xx-XxXxXxXxXxXxXxXxXxXxXxX
```

---

## 🧪 Test Your Keys

After editing `.env`, test if they work:

```bash
cd mobile
npm run test:keys
```

Expected output:
```
✅ Valid keys: 1/1
🎉 All keys are valid! Your app is ready to use.
```

---

## ⚠️ Common Mistakes

### 1. Forgot to Save the File
- Make sure you **saved** the `.env` file after editing!

### 2. Key Doesn't Start with "AIza"
- Valid: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` ✅
- Invalid: `AQ.Ab8RN6XXXXXXXXXXXXXXXXXXXXXX` ❌
- Invalid: `YOUR_ACTUAL_GEMINI_API_KEY_HERE` ❌

### 3. Extra Spaces or Quotes
- Wrong: `GEMINI_API_KEY= AIzaSy...` (space before key)
- Wrong: `GEMINI_API_KEY="AIzaSy..."` (quotes around key)
- Right: `GEMINI_API_KEY=AIzaSy...` ✅

### 4. Editing the Wrong File
- Edit: `mobile/.env` ✅
- NOT: `mobile/.env.example` ❌
- NOT: `mobile/src/config/keys.js` ❌

---

## 🔐 Security Reminder

- ✅ DO: Keep your `.env` file private
- ✅ DO: `.env` is already in `.gitignore`
- ❌ DON'T: Commit `.env` to Git
- ❌ DON'T: Share your API keys publicly

---

## 🎯 Quick Checklist

- [ ] Went to https://aistudio.google.com/app/apikey
- [ ] Created API key (starts with "AIza")
- [ ] Copied the key
- [ ] Opened `mobile/.env` in text editor
- [ ] Replaced `YOUR_ACTUAL_GEMINI_API_KEY_HERE` with real key
- [ ] Saved the file
- [ ] Ran `npm run test:keys` (passed ✅)
- [ ] Rebuilt APK (`npm run build:apk`)
- [ ] Installed on phone
- [ ] Tested Gemini features (waste scan works!)

---

## 🆘 Still Having Issues?

### Error: "Cannot find module '@env'"
```bash
npm install --save-dev react-native-dotenv
npm run start:reset
```

### Error: "Invalid API key" in test
- Double-check the key starts with "AIza"
- Make sure you copied the entire key
- Try creating a new key in Google AI Studio

### Error: App still crashes
```bash
# Complete rebuild
cd mobile
npm run build:clean
rm -rf node_modules
npm install
npm run build:apk
npm run install:apk
```

---

## ✅ You're Done When...

The app should work when you:
1. Open "Scan Waste" screen
2. Take/select a photo
3. AI analyzes it and shows results (item name, bin color, etc.)

No more "Uncaught Error" messages! 🎉

---

Need more help? Check **README_GEMINI_FIX.md** for detailed troubleshooting.
