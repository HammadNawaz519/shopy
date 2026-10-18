```bat
@echo off
setlocal EnableExtensions

rem ============================================================
rem SHOPY - Build a fresh APK and replace the old public APK
rem Project: D:\VS Code\Shopy\Web
rem Output:  D:\VS Code\Shopy\Web\public\shopy.apk
rem No device or ADB required.
rem ============================================================

cd /d "%~dp0"
if errorlevel 1 goto :fail

set "JAVA_HOME=D:\Claude\Tools\jdk21x\jdk-21.0.12.1+1"
set "PATH=%JAVA_HOME%\bin;%PATH%"

set "APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
set "OUT=%~dp0public\shopy.apk"

echo.
echo ============================================================
echo [1/4] Building cap-shell
echo ============================================================

cmd /c "node scripts\build-cap-shell.mjs"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo [2/4] Syncing Capacitor Android
echo ============================================================

cmd /c "node node_modules\@capacitor\cli\bin\capacitor sync android"
if errorlevel 1 goto :fail

echo.
echo ============================================================
echo [3/4] Cleaning and building a fresh Android APK
echo ============================================================

cmd /c "cd /d ""%~dp0android"" && gradlew.bat clean assembleDebug"
if errorlevel 1 goto :fail

if not exist "%APK%" (
    echo ERROR: The newly built APK was not found.
    echo Expected: "%APK%"
    goto :fail
)

echo.
echo ============================================================
echo [4/4] Replacing the old APK in Web\public
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
echo SUCCESS - FRESH SHOPY APK CREATED
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
```