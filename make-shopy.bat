@echo off
setlocal EnableExtensions

rem ============================================================
rem  SHOPY - ONE-CLICK "MAKE SHOPY" (builds EVERYTHING)
rem
rem  [1/7] Build the Next.js app            (fresh .next fallback)
rem  [2/7] Capacitor sync android           (native shell + assets)
rem  [3/7] Render public\logo.svg -> splash icon PNG (sharp)
rem  [4/7] Gradle clean + assembleDebug     (JDK 21, fresh APK)
rem  [5/7] REPLACE the old public\shopy.apk
rem  [6/7] If your phone is plugged in: uninstall + install it
rem  [7/7] Print the signing SHA-1 (Google Cloud registration)
rem
rem  Usage: double-click, or from any folder:
rem      cd "D:\VS Code\Shopy\Web"
rem      .\make-shopy.bat
rem
rem  Tools used (paths already set - edit here if they move):
rem    JDK 21 : D:\Claude\Tools\jdk21x\jdk-21.0.12.1+1
rem    adb    : D:\Claude\Tools\android-sdk\platform-tools\adb.exe
rem ============================================================

cd /d "%~dp0"
if errorlevel 1 goto :fail

set "JAVA_HOME=D:\Claude\Tools\jdk21x\jdk-21.0.12.1+1"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ADB=D:\Claude\Tools\android-sdk\platform-tools\adb.exe"
set "APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
set "OUT=%~dp0public\shopy.apk"

rem --- guardrails -------------------------------------------------
if not exist "%JAVA_HOME%\bin\keytool.exe" (
    echo ERROR: JDK 21 not found at %JAVA_HOME%
    goto :fail
)
if not exist "node_modules" (
    echo ERROR: node_modules is missing. Run "npm install" in this folder first.
    goto :fail
)

echo.
echo ============================================================
echo  [1/7] Building the Next.js app (fresh .next fallback)
echo ============================================================

rem NOTE: the "< nul" keeps node/gradle from swallowing the next lines
rem of this script. Do NOT remove it.
cmd /c "node node_modules\next\dist\bin\next build < nul"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo  [2/7] Syncing the Capacitor Android shell
echo ============================================================

cmd /c "node node_modules\@capacitor\cli\bin\capacitor sync android < nul"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo  [3/7] Copying the splash icon image to the Android resource
echo ============================================================

cmd /c "node scripts\make-splash-icon.mjs < nul"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo  [4/7] Clean + build a FRESH debug APK (JDK 21)
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
echo  [5/7] REPLACING the old APK  (public\shopy.apk)
echo ============================================================

if not exist "%~dp0public" (
    mkdir "%~dp0public"
)
copy /y "%APK%" "%OUT%" >nul
if errorlevel 1 goto :fail

if not exist "%OUT%" (
    echo ERROR: Destination APK was not created.
    goto :fail
)
for %%A in ("%OUT%") do set "SZ=%%~zA"
echo   OK - %OUT%  (%SZ% bytes)

echo.
echo ============================================================
echo  [6/7] Install on your phone (if plugged in)
echo ============================================================

if not exist "%ADB%" (
    echo   adb not found - install manually: copy %OUT% to the phone.
    goto :sha1
)

"%ADB%" start-server >nul 2>&1

rem --- poll for a device, up to 30s ------------------------------
set "WAIT=0"
:waitdev
set "DEVCOUNT=0"
for /f "tokens=2" %%a in ('"%ADB%" devices 2^>nul') do (
    if "%%a"=="device" set /a DEVCOUNT+=1
)
if %DEVCOUNT% gtr 0 goto :install
set /a WAIT+=1
if %WAIT% geq 6 (
    echo   No phone detected. The APK is BUILT + REPLACED:
    echo      %OUT%
    echo   Plug in your phone, allow the USB-debug prompt, then run:
    echo      "%ADB%" install -r "%OUT%"
    goto :sha1
)
echo   waiting for a device ... (%WAIT%/6) - plug in your phone + allow the USB-debug prompt.
timeout /t 5 >nul
goto :waitdev

:install
echo   device found - replacing the installed SHOPY (com.shopy.fashion) ...
"%ADB%" uninstall com.shopy.fashion >nul 2>&1
"%ADB%" install -r "%OUT%"
if errorlevel 1 goto :fail

echo.
echo   INSTALLED. Cold-launch the SHOPY icon and test:
echo     - cream splash with the SHOPY label-box logo, releases on first frame
echo     - Google sign-in button (logcat tag "NativeGoogleAuth" shows registered=true)
echo     - offline: cached pages open instantly, uncached shows the 404-styled offline page

echo.
echo ============================================================
echo  [7/7] Signing certificate (SHA-1) of THIS APK
echo ============================================================
goto :sha1

:sha1
rem The debug keystore Gradle signs with - user home first, then the SDK root.
set "KEYSTORE="
if exist "%USERPROFILE%\.android\debug.keystore" (
    set "KEYSTORE=%USERPROFILE%\.android\debug.keystore"
) else if exist "D:\Claude\Tools\android-sdk\.android\debug.keystore" (
    set "KEYSTORE=D:\Claude\Tools\android-sdk\.android\debug.keystore"
)
if defined KEYSTORE (
    echo  Signing key: %KEYSTORE%
    "%JAVA_HOME%\bin\keytool" -list -v -keystore "%KEYSTORE%" -storepass android 2>nul | findstr /i "SHA1:"
    echo.
    echo  In-app Google sign-in must match this:
    echo   - Google Cloud Console ^> Credentials (project: shopy-new):
    echo       ANDROID client, package com.shopy.fashion, SHA-1 = the line above
    echo       (SHA-1 only - the console UI does not take SHA-256 for Android clients)
    echo   - Vercel ^> buyatshopy ^> Environment Variables: GOOGLE_ANDROID_CLIENT_ID
    echo       = that Android client's id, then REDEPLOY.
) else (
    echo  Debug keystore not found yet. Gradle creates it on the first build.
    echo  Run this script once more and the SHA-1 prints here.
)

rem Web-side changes (offline page, admin DB panel, service worker) only reach
rem the app after a Vercel deploy, because the APK loads the live site:
echo.
echo  REMEMBER: web changes deploy via git:
echo      git add -A ^&^& git commit -m "shopy update" ^&^& git push
echo      (Vercel auto-deploys; the service worker picks it up on next app load)

echo.
echo ============================================================
echo  SUCCESS - SHOPY BUILT, OLD APK REPLACED
echo ============================================================
echo.
echo  APK path:      %OUT%
echo  APK size:      %SZ% bytes
echo  Install:       "%ADB%" install -r "%OUT%"   ^(if step [6/7] skipped^)
echo.
exit /b 0

:fail
echo.
echo ============================================================
echo  BUILD FAILED - see the errors above.
echo  The old destination APK has not been deleted.
echo ============================================================
exit /b 1
