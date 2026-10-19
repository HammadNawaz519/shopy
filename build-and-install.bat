@echo off
setlocal EnableExtensions
rem =============================================================================
rem  SHOPY - ONE-CLICK: build Next.js - sync - build APK (JDK 21) - install/replace
rem
rem  Uses your LOCAL tools:
rem    JDK 21 : D:\Claude\Tools\jdk21x\jdk-21.0.12.1+1   (required by Capacitor 8)
rem    adb    : D:\Claude\Tools\android-sdk\platform-tools\adb.exe
rem    SDK    : D:\Claude\Tools\android-sdk
rem
rem  How to run (from anywhere):
rem      cd "D:\VS Code\Shopy\Web"
rem      .\build-and-install.bat
rem  (Double-clicking the .bat also works - it cd's to its own folder.)
rem
rem  IMPORTANT: every node / npx / gradle call below has "< nul". Without it
rem  those tools swallow the following lines of this script from stdin and the
rem  batch silently stops partway (the bug you just hit after step 2).
rem =============================================================================

cd /d "%~dp0"
set "JAVA_HOME=D:\Claude\Tools\jdk21x\jdk-21.0.12.1+1"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ADB=D:\Claude\Tools\android-sdk\platform-tools\adb.exe"
set "APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"

echo ============================================================
echo  [1/4] Building the Next.js app (fresh .next fallback)
echo ============================================================
node node_modules\next\dist\bin\next build < nul
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo  [2/4] Syncing shell into the Android project
echo ============================================================
rem Call the Capacitor CLI directly with node. (npx re-opens stdin and eats the
rem rest of this script, so a plain node call - which step 1 proves is safe -
rem runs it instead. `node <cli> sync android` is identical to `npx cap sync android`.)
node node_modules\@capacitor\cli\bin\capacitor sync android < nul
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo  [3/4] Building the debug APK (JDK 21)
echo ============================================================
java -version
pushd android
call gradlew.bat assembleDebug < nul
set "GRC=%ERRORLEVEL%"
popd
if not "%GRC%"=="0" goto :fail
if not exist "%APK%" (
    echo APK not found at expected path: "%APK%"
    goto :fail
)

echo.
echo ============================================================
echo  [4/4] Install / replace on device (com.shopy.fashion)
echo ============================================================
"%ADB%" start-server >nul 2>&1

rem --- wait for a device to appear (re-checks every 5s, up to ~2 min) -------
set "WAIT=0"
:waitdev
set "DEVCOUNT=0"
for /f "tokens=2" %%a in ('"%ADB%" devices 2^>nul') do (
    if "%%a"=="device" set /a DEVCOUNT+=1
)
if %DEVCOUNT% gtr 0 goto :install
set /a WAIT+=1
if %WAIT% geq 24 (
    echo.
    echo  No device detected within 2 minutes. The APK is BUILT:
    echo      "%APK%"
    echo  Connect your phone, turn ON USB debugging, accept the prompt, then run:
    echo      "%ADB%" install -r "%APK%"
    exit /b 0
)
echo   waiting for a device ... (%WAIT%/24) - plug in your phone + allow the USB-debug prompt.
timeout /t 5 >nul
goto :waitdev

:install
echo   device found - uninstalling old SHOPY + installing the new APK ...
"%ADB%" uninstall com.shopy.fashion >nul 2>&1
"%ADB%" install -r "%APK%"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo  SUCCESS - APK built, installed and replaced com.shopy.fashion
echo  APK: "%APK%"
echo  Now cold-launch the SHOPY icon and test:
echo    - ~0.3s first frame; images render (they work OFFLINE too)
echo    - product / collection / search / cart / account stay IN-APP
echo    - footer social icons open the browser (intended)
echo    - Google sign-in, Android back button, airplane mode
echo ============================================================
exit /b 0

:fail
echo.
echo BUILD / INSTALL FAILED - see the messages above.
exit /b 1
