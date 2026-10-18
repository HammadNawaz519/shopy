@echo off
setlocal EnableExtensions
rem =============================================================================
rem  SHOPY - build the APK and hand you a clean "shopy.apk".  NO DEVICE.
rem
rem  What it does (all local, no USB / no adb / no device):
rem    [1/3] rebuild the local cap-shell (images + landing media)
rem    [2/3] sync into the Android project + build the debug APK (local JDK 21)
rem    [3/3] copy the result to  D:\VS Code\Shopy\Web\shopy.apk  (overwrites
rem          any previous shopy.apk each run)
rem
rem  Run:
rem      cd "D:\VS Code\Shopy\Web"
rem      .\make-shopy-apk.bat
rem
rem  Then just take "shopy.apk" and move it to your phone (or anywhere) - you
rem  install it there yourself. This script never touches a device.
rem
rem  NOTE: the node/capacitor/gradle calls use "< nul" so they don't swallow
rem        the rest of this script (the npx bug). The sync is run via node
rem        directly instead of npx for the same reason.
rem =============================================================================

cd /d "%~dp0"
set "JAVA_HOME=D:\Claude\Tools\jdk21x\jdk-21.0.12.1+1"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "APK=android\app\build\outputs\apk\debug\app-debug.apk"

echo ============================================================
echo  [1/3] Building cap-shell (images + landing media)
echo ============================================================
node scripts\build-cap-shell.mjs < nul
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo  [2/3] Sync + build APK (JDK 21)
echo ============================================================
node node_modules\@capacitor\cli\bin\capacitor sync android < nul
if errorlevel 1 goto :fail

java -version
pushd android
call gradlew.bat assembleDebug < nul
set "GRC=%ERRORLEVEL%"
popd
if not "%GRC%"=="0" goto :fail
if not exist "%APK%" (
    echo Built APK not found: "%APK%"
    goto :fail
)

echo.
echo ============================================================
echo  [3/3] Packaging as shopy.apk
echo ============================================================
copy /y "%APK%" "shopy.apk"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo  DONE. No device was used.
echo  Your APK is:  D:\VS Code\Shopy\Web\shopy.apk
echo  Move that file to your phone and install it there.
echo ============================================================
exit /b 0

:fail
echo.
echo BUILD FAILED - see the messages above.
exit /b 1
