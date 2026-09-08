# FuelTrack One-Click Android APK Build Script
Write-Host ">>> 1. Building React web assets..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ">>> 2. Syncing Capacitor Android assets..." -ForegroundColor Cyan
npx cap sync android
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ">>> 3. Configuring portable Java & Android SDK..." -ForegroundColor Cyan
$env:JAVA_HOME = "$PSScriptRoot\tools\jdk-21.0.6+7"
$env:ANDROID_HOME = "$PSScriptRoot\tools\android-sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:PATH"

Write-Host ">>> 4. Compiling Android APK with Gradle..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\android"
cmd.exe /c "gradlew.bat assembleDebug"
$buildExit = $LASTEXITCODE
Pop-Location

if ($buildExit -eq 0) {
  $apkPath = "$PSScriptRoot\android\app\build\outputs\apk\debug\app-debug.apk"
  if (Test-Path $apkPath) {
    $sizeMb = [math]::Round(((Get-Item $apkPath).Length / 1MB), 2)
    Write-Host "`n>>> [SUCCESS] APK built successfully!" -ForegroundColor Green
    Write-Host ">>> Location: $apkPath ($sizeMb MB)" -ForegroundColor Yellow
  }
} else {
  Write-Host "`n>>> [ERROR] Gradle build failed with exit code $buildExit" -ForegroundColor Red
}
