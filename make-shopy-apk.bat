@echo off
setlocal EnableExtensions

rem ============================================================
rem SHOPY - Build a FULL APK and replace the old public APK
rem Project: D:\VS Code\Shopy\Web
rem Output:  D:\VS Code\Shopy\Web\public\shopy.apk
rem No device or ADB required.
rem
rem The local shell (cap-shell / local-shell) has been removed.
rem The APK now loads the live site (server.url) as a full
rem Capacitor app - see capacitor.config.ts.
rem
rem Step [5/5] prints the signing certificate SHA-1 used for
rem this APK. Register it (with package name com.shopy.fashion)
rem in Google Cloud Console to make in-app Google sign-in work.
rem ============================================================

cd /d "%~dp0"
if errorlevel 1 goto :fail

set "JAVA_HOME=D:\Claude\Tools\jdk21x\jdk-21.0.12.1+1"
set "PATH=%JAVA_HOME%\bin;%PATH%"

set "APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
set "OUT=%~dp0public\shopy.apk"

echo.
echo ============================================================
echo [1/5] Building the Next.js app (fresh .next fallback)
echo ============================================================

cmd /c "node node_modules\next\dist\bin\next build < nul"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo [2/5] Syncing Capacitor Android
echo ============================================================

cmd /c "node node_modules\@capacitor\cli\bin\capacitor sync android < nul"
if errorlevel 1 goto :fail

rem Splash icon: copy the chosen splash image -> res\drawable-nodpi\shopy_splash_logo.*
rem (source defined in scripts\make-splash-icon.mjs; required by the splash
rem theme's windowSplashScreenAnimatedIcon)
cmd /c "node scripts\make-splash-icon.mjs < nul"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo [3/5] Cleaning and building a fresh Android APK
echo ============================================================

cmd /c "cd /d ""%~dp0android"" && gradlew.bat clean assembleDebug < nul"
if errorlevel 1 goto :fail

if not exist "%APK%" (
    echo ERROR: The newly built APK was not found.
    echo Expected: "%APK%"
    goto :fail
)

echo.
echo ============================================================
echo [4/5] Replacing the old APK in Web\public
echo ============================================================

if not exist "%~dp0public" (
    mkdir "%~dp0public"
    if errorlevel 1 goto :fail
)

copy /y "%APK%" "%OUT%"
if errorlevel 1 goto :fail

if not exist "%OUT%" (
    echo ERROR: The destination APK was not created.
    goto :fail
)

for %%A in ("%OUT%") do set "SZ=%%~zA"

echo.
echo ============================================================
echo [5/5] Signing certificate (SHA-1) of THIS APK
echo ============================================================
rem This build signs with Gradle's default debug keystore, auto-created on
rem the first build. Check the standard user location first, then the SDK
rem root. The SHA-1 printed below is what Google Cloud Console must know
rem for in-app Google sign-in. If the keystore file is ever deleted or the
rem build runs on another machine, a new fingerprint is generated and the
rem console entry must be updated.
set "KEYSTORE="
if exist "%USERPROFILE%\.android\debug.keystore" (
    set "KEYSTORE=%USERPROFILE%\.android\debug.keystore"
) else if exist "D:\Claude\Tools\android-sdk\.android\debug.keystore" (
    set "KEYSTORE=D:\Claude\Tools\android-sdk\.android\debug.keystore"
)
rem NOTE: the ">" below stays a plain redirect on purpose. If it is ever
rem caret-escaped inside this block, keytool receives the literal text
rem 2>nul as an argument and dies with an Illegal option error.
if defined KEYSTORE (
    echo  Signing key: %KEYSTORE%
    "%JAVA_HOME%\bin\keytool" -list -v -keystore "%KEYSTORE%" -storepass android 2>nul | findstr /i "SHA1:"
) else (
    echo  Debug keystore not found yet. Gradle creates it on the first
    echo  build. Run this script once more and the fingerprint prints here.
)
echo.
echo  To make in-app Google sign-in work (one-time setup):
echo   1) Google Cloud Console ^> Credentials (project: shopy-new)
echo      - ANDROID OAuth client: package com.shopy.fashion + SHA-1 above
echo      - WEB OAuth client: this is GOOGLE_CLIENT_ID / Credential Manager
echo   2) Vercel GOOGLE_CLIENT_ID = the WEB client id (already used by web login)
echo      Optional: GOOGLE_ANDROID_CLIENT_ID = the ANDROID client id (audience only)
echo.

echo ============================================================
echo SUCCESS - FRESH FULL SHOPY APK CREATED
echo ============================================================
echo.
echo APK path:
echo %OUT%
echo.
echo APK size: %SZ% bytes
echo.
echo The previous public\shopy.apk has been replaced.
echo No device or ADB was used.
echo ============================================================

exit /b 0

:fail
echo.
echo ============================================================
echo BUILD FAILED
echo Check the errors above.
echo The old destination APK has not been intentionally deleted.
echo ============================================================
exit /b 1
