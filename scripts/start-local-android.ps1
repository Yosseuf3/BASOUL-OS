$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path $PSScriptRoot -Parent
$localRoot = Join-Path $repositoryRoot '.git/basoul-local'
$avdHome = Join-Path $localRoot 'android-avd'
$imageDirectory = Join-Path $localRoot 'aosp-api35/x86_64'
$sdkRoot = $env:ANDROID_HOME
if (-not $sdkRoot) { $sdkRoot = $env:ANDROID_SDK_ROOT }
if (-not $sdkRoot) { throw 'Existing Android SDK is required.' }
$emulator = Join-Path $sdkRoot 'emulator/emulator.exe'
$adb = Join-Path $sdkRoot 'platform-tools/adb.exe'
if (-not (Test-Path -LiteralPath $emulator)) { throw 'Existing emulator executable unavailable.' }
if (-not (Test-Path -LiteralPath (Join-Path $avdHome 'BASOUL_Local_API35.ini'))) { throw 'Provision the documented project-local API35 AVD first.' }
if (-not (Test-Path -LiteralPath (Join-Path $imageDirectory 'system.img'))) { throw 'Verified official API35 image unavailable.' }
if ((& $adb devices) -match 'emulator-5556\s') { throw 'Port 5556 is occupied; preserve that emulator.' }
$previousAvdHome = $env:ANDROID_AVD_HOME
try {
  $env:ANDROID_AVD_HOME = $avdHome
  $process = Start-Process -FilePath $emulator -ArgumentList @(
    '-avd','BASOUL_Local_API35','-sysdir',('"' + $imageDirectory + '"'),'-port','5556',
    '-read-only','-memory','1536','-cores','2','-gpu','swiftshader','-feature','-Vulkan',
    '-no-window','-no-boot-anim','-no-audio','-no-snapshot-load','-no-snapshot-save',
    '-camera-back','none','-camera-front','none'
  ) -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $localRoot 'api35-emulator.log') -RedirectStandardError (Join-Path $localRoot 'api35-emulator-error.log')
  $process.Id | Set-Content (Join-Path $localRoot 'api35-emulator.pid')
  Write-Output "Started project-local read-only API35 emulator: PID $($process.Id), serial emulator-5556."
} finally { $env:ANDROID_AVD_HOME = $previousAvdHome }
