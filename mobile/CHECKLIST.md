# ✅ Gemini API Fix Checklist

Copy this checklist and mark items as you complete them!

---

## 📋 Pre-Build Checklist

### Package Installation
- [ ] `react-native-dotenv` installed (already done ✅)
- [ ] `dotenv` installed (already done ✅)
- [ ] Run `npm install` successfully
- [ ] No error messages in console

### API Keys Setup
- [ ] Visited https://aistudio.google.com/app/apikey
- [ ] Created at least 1 API key (recommended: 3)
- [ ] Copied API key(s) to clipboard
- [ ] Keys start with `AIza` (not `AQ.Ab8RN6...`)
- [ ] Keys are approximately 39 characters long

### Environment File
- [ ] Located `mobile/.env` file
- [ ] Opened `.env` in text editor
- [ ] Pasted real API key in `GEMINI_API_KEY=`
- [ ] (Optional) Pasted 2nd key in `GEMINI_API_KEY_2=`
- [ ] (Optional) Pasted 3rd key in `GEMINI_API_KEY_3=`
- [ ] Saved the `.env` file
- [ ] Confirmed backend URL is correct: `https://bingo-backend-2zmk.onrender.com/api/v1`

### Verification
- [ ] Ran `npm run test:keys`
- [ ] All keys show ✅ SUCCESS
- [ ] No ❌ FAILED messages

---

## 🔨 Build Process Checklist

### Clean Build
- [ ] Navigated to `mobile` folder in terminal
- [ ] Ran `npm run build:clean`
- [ ] No errors during clean
- [ ] Old build artifacts removed

### Clear Cache
- [ ] Ran `npm run start:reset`
- [ ] Metro bundler started
- [ ] Pressed Ctrl+C to stop after it loads
- [ ] Cache cleared message appeared

### Build APK
- [ ] Ran `npm run build:apk`
- [ ] Build process started (takes 5-10 minutes)
- [ ] No errors during build
- [ ] "BUILD SUCCESSFUL" message appeared
- [ ] APK file exists at: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📱 Installation Checklist

### Device Preparation
- [ ] Phone connected via USB cable
- [ ] USB debugging enabled on phone
- [ ] Ran `adb devices` - phone listed
- [ ] Phone is authorized (not "unauthorized")

### APK Installation
- [ ] Ran `npm run install:apk` (or installed manually)
- [ ] Installation started on phone
- [ ] Accepted "Install Unknown Apps" permission (if needed)
- [ ] Installation completed successfully
- [ ] BinGo app icon visible on phone

---

## 🧪 Testing Checklist

### Basic App Functionality
- [ ] Opened BinGo app
- [ ] App doesn't crash on startup
- [ ] Can navigate between tabs
- [ ] No obvious errors or blank screens

### Gemini AI Features - Waste Scanner
- [ ] Opened "Scan Waste" screen
- [ ] Tapped camera button or select image
- [ ] Took/selected a photo of an item
- [ ] Photo uploaded successfully
- [ ] AI analysis started (loading indicator)
- [ ] Got results back:
  - [ ] Item name displayed
  - [ ] Bin color shown
  - [ ] Disposal steps listed
  - [ ] Confidence level shown
  - [ ] Environmental impact info
- [ ] No "API key" errors
- [ ] No "rate limit" errors

### Gemini AI Features - Recycling Guide
- [ ] Opened "Recycling Guide" screen
- [ ] Searched for an item (e.g., "plastic bottle")
- [ ] AI provided disposal instructions
- [ ] Information looks correct and complete

### Multiple Scans (Rate Limit Test)
- [ ] Scanned 5-10 different items rapidly
- [ ] All scans completed successfully
- [ ] No rate limit errors (if using 3 keys)
- [ ] Response times acceptable

---

## 🔍 Verification Checklist

### Logs Check (Optional but Recommended)
- [ ] Ran `adb logcat | grep -i gemini` in terminal
- [ ] No error messages about API keys
- [ ] No "invalid key" messages
- [ ] No "authentication failed" messages

### File Security Check
- [ ] Ran `git status`
- [ ] Confirmed `.env` file NOT in the list
- [ ] `.env` is properly gitignored
- [ ] No API keys visible in Git diff

---

## 🎯 Success Criteria

You can mark this as COMPLETE when ALL of these are true:

- [x] ✅ react-native-dotenv installed
- [x] ✅ babel.config.js configured
- [x] ✅ keys.js updated to use @env
- [ ] ✅ Real API keys added to .env
- [ ] ✅ Keys validated with test:keys script
- [ ] ✅ APK built successfully
- [ ] ✅ APK installed on phone
- [ ] ✅ Waste scanner works
- [ ] ✅ Recycling guide works
- [ ] ✅ No API errors in logs
- [ ] ✅ .env not in Git

---

## 📊 Troubleshooting Reference

If you get stuck on any checkbox, refer to:

| Issue | See Document |
|-------|-------------|
| Don't know how to get API keys | **QUICK_FIX.md** Step 2 |
| test:keys fails | **README_GEMINI_FIX.md** Troubleshooting |
| Build errors | **COMMANDS.md** Troubleshooting Commands |
| APK won't install | **README_GEMINI_FIX.md** Installation section |
| Features don't work | **README_GEMINI_FIX.md** Testing section |
| Need command reference | **COMMANDS.md** |

---

## 🎉 Completion

When all boxes are checked, you're done!

**Estimated Total Time**: 10-15 minutes

**What worked?** 
- [ ] Everything worked on first try!
- [ ] Had some issues but resolved them
- [ ] Still having issues (check troubleshooting docs)

---

## 📝 Notes

Use this space to write any issues you encountered or reminders:

```
_____________________________________________________________

_____________________________________________________________

_____________________________________________________________

_____________________________________________________________
```

---

## 🚀 Next Steps After Success

- [ ] Test all app features thoroughly
- [ ] Share APK with team/testers
- [ ] Monitor API usage in Google AI Studio
- [ ] Consider implementing backend proxy for production
- [ ] Set up key rotation schedule

---

**Good luck!** If you completed all checkboxes, you're ready to go! 🎊
