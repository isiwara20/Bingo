# BinGo – Development Environment Setup

Complete step-by-step guide for all team members setting up from scratch.

---

## What You Need to Install

| Tool | Required Version | Download |
|---|---|---|
| Node.js | v18 LTS or higher | https://nodejs.org/en/download |
| Git | 2.x | https://git-scm.com/downloads |
| JDK (Temurin) | 17 or higher | https://adoptium.net/temurin/releases/ |
| Android Studio | Latest | https://developer.android.com/studio |
| VS Code | Latest | https://code.visualstudio.com/ |

---

## Step 1 – Install Node.js

1. Download and install from https://nodejs.org (choose LTS version)
2. Verify in a terminal:
   ```bash
   node --version   # v18.x.x or higher
   npm --version    # 9.x.x or higher
   ```

---

## Step 2 – Install JDK 17+

React Native's Gradle build requires JDK 17 or higher.

1. Go to https://adoptium.net/temurin/releases/
2. Select: **JDK 17 or 21**, **Windows**, **x64**, **JDK**, **.msi**
3. Download and run the installer
4. During install, check the option **"Set JAVA_HOME variable"** — this sets it automatically

Verify:
```bash
java -version
# openjdk version "17.x.x" or "21.x.x"
```

> **Note for this project:** JDK 25 also works. Whatever version you install, make sure `java -version` shows it (not Java 8).

---

## Step 3 – Install Android Studio + SDK

### 3a. Install Android Studio

1. Download from https://developer.android.com/studio
2. Run the installer with all default options selected
3. On first launch, complete the **Setup Wizard** — it will download the SDK automatically

### 3b. Install Required SDK Components

Open **Android Studio → Tools → SDK Manager**:

**SDK Platforms tab:**
- ✅ Android 14 (API 34) — or higher
- ✅ Android 15 (API 35) — recommended

**SDK Tools tab:**
- ✅ Android SDK Build-Tools 35.0.0
- ✅ Android SDK Command-line Tools (latest)
- ✅ Android Emulator
- ✅ Android SDK Platform-Tools

Click **Apply → OK**.

### 3c. Set Environment Variables

**Windows — open System Environment Variables:**
`Start → search "Edit the system environment variables" → Environment Variables`

**Add these User Variables:**

| Variable | Value (adjust path to match your install) |
|---|---|
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot` |
| `ANDROID_HOME` | `C:\Users\<YOUR_USERNAME>\AppData\Local\Android\Sdk` |
| `ANDROID_SDK_ROOT` | Same as `ANDROID_HOME` |

> The Android SDK path is shown at the top of the SDK Manager window in Android Studio. Use whatever path is shown there.

**Add to the PATH variable:**
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\emulator
%ANDROID_HOME%\cmdline-tools\latest\bin
%JAVA_HOME%\bin
```

**Open a new terminal and verify:**
```bash
java -version          # should show JDK 17+
adb --version          # Android Debug Bridge version x.x.x
```

---

## Step 4 – Create an Android Emulator (AVD)

1. In Android Studio go to **Tools → Device Manager** (or AVD Manager)
2. Click **Create Virtual Device**
3. Select **Pixel 6** → Next
4. Select system image **API 35 (Android 15)** → download if needed → Next
5. Click **Finish**
6. Click the **▶ play button** to start the emulator

Verify it's running:
```bash
adb devices
# emulator-5554   device
```

> Alternatively, use a **physical Android phone** — see the Physical Device section below.

---

## Step 5 – Clone the Repository

```bash
git clone https://github.com/isiwara20/Bingo.git
cd Bingo
```

---

## Step 6 – Backend Setup

```bash
cd server
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Open `server/.env` and fill in:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://arwenrhea88_db_user:YbdxFWJJvVspAa0f@cluster0.f5sdpim.mongodb.net/bingo?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=bingo_jwt_secret_dev_2024_change_in_production
JWT_EXPIRE=7d
```

> The `MONGODB_URI` above is our shared dev database on MongoDB Atlas. Everyone uses this same URI.

Start the server:
```bash
npm run dev
```

You should see:
```
MongoDB Atlas connected: ac-kfkdvtk-shard-00-00.f5sdpim.mongodb.net
===========================================
  BinGo API Server
  Environment : development
  Port        : 5000
  Health      : http://localhost:5000/api/v1/health
===========================================
```

Verify:
```bash
curl http://localhost:5000/api/v1/health
# {"success":true,"data":{"server":"online","database":"connected"}}
```

---

## Step 7 – Mobile Setup

```bash
cd mobile
npm install
```

Create `local.properties` for Gradle (tells it where your Android SDK is):

**Windows — run this in the `mobile/android/` folder:**
```bash
# Replace the path with YOUR actual Android SDK path
echo sdk.dir=C\:\\Users\\<YOUR_USERNAME>\\AppData\\Local\\Android\\Sdk > android/local.properties
```

Or create the file `mobile/android/local.properties` manually with this content:
```
sdk.dir=C\:\\Users\\<YOUR_USERNAME>\\AppData\\Local\\Android\\Sdk
```

> Use double backslashes `\\` and a colon escape `C\:`. The path must match where Android Studio installed the SDK on your machine.

---

## Step 8 – Run the Project

You need **3 terminals** open simultaneously.

### Terminal 1 — Backend
```bash
cd server
npm run dev
```

### Terminal 2 — Metro Bundler (keep this running)
```bash
cd mobile
npm start
```

### Terminal 3 — Deploy to Android
```bash
cd mobile
npm run android
```

The first build takes 5–10 minutes (Gradle downloads dependencies). Subsequent builds are much faster.

---

## Using a Physical Android Phone

Faster than an emulator and works great for testing.

1. On your phone: **Settings → About Phone → tap Build Number 7 times**
2. Go to **Settings → Developer Options → enable USB Debugging**
3. Plug phone into PC via USB
4. On the phone, tap **Allow** on the USB Debugging permission popup
5. Verify it's detected:
   ```bash
   adb devices
   # XXXXXXXXXX   device
   ```
6. Run `npm run android` — it will install directly on your phone

---

## Seed the Database (optional)

To populate the database with sample users and waste locations:

```bash
cd server
node src/config/seed.js
```

This creates 4 test users. Use these to log in during development:

| Role | Email | Password |
|---|---|---|
| Admin | admin@devbingo.com | Admin1234! |
| Moderator | moderator@devbingo.com | Mod12345! |
| User | john@devbingo.com | User1234! |
| User | jane@devbingo.com | User1234! |

---

## Run Backend Tests

```bash
cd server
npm test
```

Expected: 53 tests passing across auth, reporting, map, and RBAC suites.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `java -version` shows Java 8 | Move JDK 17/21 `bin` folder to the top of your PATH, above the Java 8 entry |
| `ANDROID_HOME not set` | Add it to System Environment Variables, open a new terminal |
| `local.properties not found` | Create `mobile/android/local.properties` with your SDK path |
| `adb devices` shows nothing | Reconnect USB, re-enable USB Debugging, try a different cable |
| MongoDB connection failed (`ReplicaSetNoPrimary`) | Go to MongoDB Atlas → Network Access → add `0.0.0.0/0` |
| Metro: port 8081 in use | Run `npm start -- --port 8082` |
| `Network request failed` on emulator | Use `10.0.2.2:5000` instead of `localhost:5000` in your `.env` |
| `SDK location not found` | Check `local.properties` path uses `\\` separators |
| Gradle build fails | Make sure `JAVA_HOME` points to JDK 17+ and close Android Studio |

---

## API Base URL Reference

| Running on | API_BASE_URL in mobile `.env` |
|---|---|
| Android Emulator | `http://10.0.2.2:5000/api/v1` |
| Physical Android Phone | `http://<YOUR_PC_LOCAL_IP>:5000/api/v1` |

To find your PC's local IP:
```bash
# Windows
ipconfig
# Look for "IPv4 Address" under your Wi-Fi adapter e.g. 192.168.1.x
```

Both your phone and PC must be on the **same Wi-Fi network**.
