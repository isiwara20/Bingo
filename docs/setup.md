# BinGo – Development Environment Setup

Complete setup guide for all team members.

---

## Prerequisites Checklist

### 1. Verify Node.js (v18 LTS or higher)

```bash
node --version
# Expected: v18.x.x or higher
```

Download: https://nodejs.org/en/download

### 2. Verify npm

```bash
npm --version
# Expected: 9.x.x or higher
```

### 3. Verify Git

```bash
git --version
# Expected: git version 2.x.x
```

Download: https://git-scm.com/downloads

### 4. Verify Java Development Kit (JDK 17)

```bash
java -version
# Expected: openjdk version "17.x.x"
```

Download: https://adoptium.net/temurin/releases/

---

## Android SDK Setup (Windows)

### Step 1: Install Android Studio

Download from: https://developer.android.com/studio

During installation, ensure you select:
- Android SDK
- Android SDK Platform
- Android Virtual Device

### Step 2: Install Android SDK Platforms and Tools

Open Android Studio → SDK Manager (`Tools → SDK Manager`):

- **SDK Platforms tab:** Install **Android 14 (API 34)**
- **SDK Tools tab:** Install:
  - Android SDK Build-Tools (latest)
  - Android SDK Command-line Tools (latest)
  - Android Emulator
  - Android SDK Platform-Tools

### Step 3: Configure Environment Variables (Windows)

Open System Environment Variables:
- `Start → Edit the system environment variables → Environment Variables`

**Add to System Variables:**

| Variable | Value |
|---|---|
| `ANDROID_HOME` | `C:\Users\<YOUR_USERNAME>\AppData\Local\Android\Sdk` |
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot` |

**Add to PATH:**
```
%ANDROID_HOME%\emulator
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
```

> Replace `<YOUR_USERNAME>` with your actual Windows username.
> The exact SDK path may vary – verify it in Android Studio's SDK Manager.

### Step 4: Verify ADB

```bash
adb --version
# Expected: Android Debug Bridge version 1.x.x
```

---

## Android Emulator Setup

### Create an Android Virtual Device (AVD)

1. Open Android Studio
2. Navigate to `Tools → AVD Manager` (or Device Manager)
3. Click **Create Virtual Device**
4. Select a phone profile (e.g., **Pixel 6**)
5. Select system image: **Android 14 (API 34)** x86_64
6. Name the device and click **Finish**

### Start the Emulator

```bash
# List available AVDs
emulator -list-avds

# Start emulator (replace <AVD_NAME> with your device name)
emulator -avd <AVD_NAME>

# Or start from Android Studio: AVD Manager → ▶ Play button
```

### Verify the Emulator is Running

```bash
adb devices
# Expected output:
# List of devices attached
# emulator-5554   device
```

---

## Physical Android Device Testing

### Enable Developer Mode

1. On your Android device: `Settings → About phone`
2. Tap **Build number** 7 times
3. Developer options will appear in Settings

### Enable USB Debugging

1. `Settings → Developer options`
2. Enable **USB debugging**

### Connect and Verify

```bash
# Connect device via USB cable
adb devices
# Expected:
# List of devices attached
# <DEVICE_SERIAL>   device
```

---

## Project Installation

### 1. Clone the Repository

```bash
git clone https://github.com/<YOUR_ORG>/bingo.git
cd bingo
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret
```

### 3. Mobile Setup

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with the correct API_BASE_URL
```

---

## Running the Backend

```bash
cd server
npm run dev
```

Expected output:
```
===========================================
  BinGo API Server
  Environment : development
  Port        : 5000
  Health      : http://localhost:5000/api/v1/health
===========================================
MongoDB Atlas connected: cluster0.xxxxx.mongodb.net
```

Verify:
```bash
curl http://localhost:5000/api/v1/health
```

Expected:
```json
{
  "success": true,
  "message": "BinGo API is running",
  "data": {
    "server": "online",
    "database": "connected"
  }
}
```

---

## Running the Mobile App

### Start Metro Bundler

```bash
cd mobile
npm start
```

### Run on Android (in a second terminal)

```bash
cd mobile
npm run android
```

The app will install and launch on the emulator or connected device.

---

## MongoDB Atlas Setup

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a new **Project** named `BinGo`
3. Create a free **M0 Cluster**
4. Create a **Database User** (username + password)
5. Under **Network Access**, add IP `0.0.0.0/0` for development (allow all)
6. Click **Connect → Connect your application**
7. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/bingo?retryWrites=true&w=majority
   ```
8. Replace `<username>` and `<password>` with your credentials
9. Paste the full string into `server/.env` as `MONGODB_URI`

---

## Seed Development Data

```bash
cd server
node src/config/seed.js
```

This creates sample users for all four roles. Login details will be printed in the terminal.

---

## Common Issues

| Issue | Solution |
|---|---|
| `adb devices` shows nothing | Reconnect USB, re-enable USB debugging |
| `ANDROID_HOME not found` | Re-check environment variables, restart terminal |
| Metro: port 8081 already in use | Kill existing process or use `npm start -- --port 8082` |
| `Network request failed` | Check API_BASE_URL in `.env`, use `10.0.2.2` for emulator |
| MongoDB connection failed | Check MONGODB_URI, verify Atlas Network Access settings |
| `No such file .env` | Run `cp .env.example .env` first |
