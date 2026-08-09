# BinGo – Mobile Application

React Native application for the BinGo platform.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your backend API URL

# Start Metro bundler
npm start

# Run on Android (in a separate terminal)
npm run android
```

## Android URL Configuration

| Environment | API_BASE_URL |
|---|---|
| Android Emulator | `http://10.0.2.2:5000/api/v1` |
| Physical Device | `http://192.168.1.x:5000/api/v1` |
| Web | `http://localhost:5000/api/v1` |

> The Android emulator routes `10.0.2.2` to the host machine's `localhost`.

## Project Structure

```
mobile/
├── src/
│   ├── api/          Axios client
│   ├── assets/       Images, fonts
│   ├── components/   Reusable UI components
│   ├── config/       API config
│   ├── constants/    Colors, strings
│   ├── context/      React contexts (AuthContext)
│   ├── hooks/        Custom hooks
│   ├── navigation/   RootNavigator, AuthNavigator, MainNavigator
│   ├── screens/      All screen components
│   ├── services/     API service modules
│   └── utils/        Utility functions
├── App.js            Entry point
└── package.json
```

## Implemented Screens (Sprint 1)

| Screen | Status |
|---|---|
| SplashScreen | ✅ |
| OnboardingScreen | ✅ |
| LoginScreen | ✅ |
| RegisterScreen | ✅ |
| ForgotPasswordScreen | 🔄 Placeholder |
| HomeScreen | ✅ |
| ReportWasteScreen | ✅ |
| ReportDetailsScreen | ✅ |
| ReportStatusScreen | ✅ |
| WasteMapScreen | ✅ |
| CollectionScheduleScreen | 🔄 Placeholder (Member 3) |
| RecyclingGuideScreen | 🔄 Placeholder (Member 3) |
| CommunityScreen | 🔄 Placeholder (Member 4) |
| NotificationsScreen | 🔄 Placeholder (Member 4) |
| RewardsScreen | 🔄 Placeholder (Member 4) |
| ProfileScreen | ✅ |
| SettingsScreen | 🔄 Placeholder |
| PaymentScreen | 🔄 Placeholder (Member 1) |
