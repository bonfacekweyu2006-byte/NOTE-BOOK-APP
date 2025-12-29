# Packaging Notebook Pro for Android (Capacitor)

This guide shows how to wrap the existing single-page app into an Android APK using Capacitor.

Prerequisites
- Node.js and npm installed
- Android Studio installed with Android SDK and platform-tools
- Java JDK 11+ (match Android Studio requirements)

Steps
1. Install Capacitor CLI and core packages

```bash
npm install @capacitor/core @capacitor/cli --save
npx cap init
```

When prompted, use `Notebook Pro` and `com.example.notebookpro` (or your own id).

2. Add Android platform

```bash
npx cap add android
```

3. Sync web assets

```bash
npx cap copy android
```

4. Open Android project in Android Studio

```bash
npx cap open android
```

5. Build and run from Android Studio or use Gradle

Notes and tips
- The app uses no bundler; `webDir` is set to the project root (`./`). Capacitor copies the files as-is. If you prefer building a production bundle, move web files to a `www/` directory and set `webDir` accordingly.
- Add Android-specific permissions (e.g., storage) in `AndroidManifest.xml` if you use file APIs.
- Icons: place Android icon assets in `android/app/src/main/res/mipmap-*` following Android guidelines.
 - To generate launcher PNGs from the included SVG, install `sharp` and run the helper script:

```bash
npm install sharp --save-dev
npm run gen:android-icons
```

	The script will emit `android-res/mipmap-*/ic_launcher.png` and a `play-store` 512px PNG. Copy these into your Android project's `mipmap-*` folders or configure your build to use them.

Troubleshooting
- If `npx cap add android` fails, ensure Android SDK and `ANDROID_HOME` are configured and `gradle` is available.
- For production, configure `appId` and signing credentials in Android Studio/Gradle.

