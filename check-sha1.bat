@echo off
setlocal EnableExtensions
rem ============================================================
rem SHOPY - Print the SHA-1 of the keystore that make-shopy-apk.bat
rem signs the debug APK with (Gradle's default debug keystore).
rem No build required - just double-click.
rem ============================================================

set "KEYTOOL=D:\Claude\Tools\jdk21x\jdk-21.0.12.1+1\bin\keytool"
set "KEYSTORE="
if exist "%USERPROFILE%\.android\debug.keystore" (
    set "KEYSTORE=%USERPROFILE%\.android\debug.keystore"
) else if exist "D:\Claude\Tools\android-sdk\.android\debug.keystore" (
    set "KEYSTORE=D:\Claude\Tools\android-sdk\.android\debug.keystore"
)

if not defined KEYSTORE (
    echo Debug keystore not found. Build once with make-shopy-apk.bat,
    echo then run this again.
    pause
    exit /b 1
)

echo Signing key: %KEYSTORE%
echo.
"%KEYTOOL%" -list -v -keystore "%KEYSTORE%" -storepass android -alias androiddebugkey | findstr /i "SHA1:"
echo.
echo Use that SHA-1 value in Google Cloud Console when you add the
echo Android OAuth client for package com.shopy.fashion.
pause
