# Isolated Android validation

The existing Pixel_10 Android 37 Google Play AVD showed System UI ANRs before BASOUL execution. Its data and configuration were preserved. A separate AOSP API35 x86_64 AVD runs under `.git/basoul-local/android-avd`, with 1536 MiB RAM, two cores and SwiftShader. It does not replace the global SDK or AVD selection.

The official image archive is `https://dl.google.com/android/repository/sys-img/android/x86_64-35_r02.zip`, 782404023 bytes, verified against repository metadata SHA1 `2d857d170c0d1b827149565da34b3383e5306f7f`. The extracted image stays at `.git/basoul-local/aosp-api35/x86_64`. The dedicated AVD baseline contains the already-installed Expo Go 57.0.9 APK copied from the original emulator, without copying user data. These large generated assets are excluded from source control.

Run `scripts/start-local-android.ps1` using the existing ANDROID_HOME/ANDROID_SDK_ROOT. It launches only BASOUL_Local_API35 on emulator-5556 in read-only mode, without snapshots. Wait for `adb -s emulator-5556 shell getprop sys.boot_completed` to return 1. Start each independent run with a fresh read-only session so earlier synthetic auth tokens cannot leak into the next fixture database. Stop only this dedicated AVD with `adb -s emulator-5556 emu kill` after validation; its transient data is discarded.

With the project Node 22 wrapper, set BASOUL_NATIVE_EXPO_GO=1 in the command process and run `node scripts/validate-task-http-local.mjs --mobile`. The harness verifies the exact AVD/API, internal Docker network and loopback endpoint, serves synthetic credentials only after confirming the synthetic login marker, disables emulator Wi-Fi/mobile networking, and uses two adb reverse connections for Metro and the local gateway. It stops its app/Metro/gateway and four synthetic services in finally blocks. No EAS or APK build is involved.

Expo Go coverage verifies the development JavaScript/native UI on API35. It does not certify the production application binary, signing, device push delivery, Store compliance or Android 37 support. The dependency security gate remains blocked independently of UI results.
