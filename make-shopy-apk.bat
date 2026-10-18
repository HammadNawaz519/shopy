```bat
@echo off
setlocal EnableExtensions

rem ============================================================
rem SHOPY - Build a fresh APK and copy it to the Web main folder
rem Output: D:\VS Code\Shopy\Web\shopy.apk
rem ============================================================

cd /d "%~dp0"
if errorlevel 1 goto :fail

set "JAVA_HOME=D:\Claude\Tools\jdk21x\jdk-21.0.12.1+1"
set "PATH=%JAVA_HOME%\bin;%PATH%"

set "APK=%~dp0android\app\build\outputs\apk\debug\app-debug.apk"
set "OUT=%~dp0shopy.apk"

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
echo [3/4] Clean build - generating a fresh APK
echo ============================================================

cmd /c "cd /d ""%~dp0android"" && gradlew.bat clean assembleDebug"
if errorlevel 1 goto :fail

if not exist "%APK%" (
    echo ERROR: Build APK was not found.
    echo Expected: "%APK%"
    goto :fail
)

echo.
echo ============================================================
echo [4/4] Copying APK to the Web main folder
echo ============================================================

copy /y "%APK%" "%OUT%"
if errorlevel 1 goto :fail

if not exist "%OUT%" (
    echo ERROR: Output APK was not created.
    goto :fail
)

for %%A in ("%OUT%") do set "SZ=%%~zA"

echo.
echo ============================================================
echo SUCCESS - FRESH APK CREATED
echo.
echo Output: "%OUT%"
echo Size:   %SZ% bytes
echo.
echo The previous Web\shopy.apk has been replaced.
echo ============================================================

exit /b 0

:fail
echo.
echo ============================================================
echo BUILD FAILED - APK WAS NOT SUCCESSFULLY COPIED
echo Check the errors above.
echo ============================================================
exit /b 1
```