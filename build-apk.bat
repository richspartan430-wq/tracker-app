@echo off
REM ============================================
REM DailyDisciplineTracker - Build Release APK
REM ============================================
REM Run this from the DailyDisciplineTracker folder
REM Usage: build-apk.bat
REM ============================================

echo.
echo ==========================================
echo   Building DailyDisciplineTracker APK
echo ==========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/3] Installing JS dependencies...
    call npm ci
    if errorlevel 1 (
        echo ERROR: npm ci failed. Make sure Node.js is installed.
        exit /b 1
    )
) else (
    echo [1/3] JS dependencies already installed, skipping...
)

echo.
echo [2/3] Building Release APK (arm64-v8a only for faster build)...
echo     This may take 5-10 minutes on first build...
echo.

cd android

REM Build only arm64-v8a architecture for speed
REM Remove -PreactNativeArchitectures flag to build for all architectures
call gradlew.bat assembleRelease ^
    -PreactNativeArchitectures=arm64-v8a ^
    --no-daemon ^
    --max-workers=2 ^
    --console=plain ^
    -Dorg.gradle.logging.level=warn

if errorlevel 1 (
    echo.
    echo ==========================================
    echo   BUILD FAILED
    echo ==========================================
    echo.
    echo Common fixes:
    echo   1. Make sure ANDROID_HOME or ANDROID_SDK_ROOT is set
    echo   2. Make sure Java 17 is installed (java -version)
    echo   3. Accept SDK licenses: sdkmanager --licenses
    echo   4. Clean build: gradlew.bat clean
    echo.
    cd ..
    exit /b 1
)

cd ..

echo.
echo ==========================================
echo   BUILD SUCCESSFUL!
echo ==========================================
echo.

REM Find and display the APK path
set "APK_DIR=android\app\build\outputs\apk\release"
if exist "%APK_DIR%\app-release.apk" (
    echo APK Location:
    echo   %CD%\%APK_DIR%\app-release.apk
    echo.
    
    REM Copy APK to project root for easy access
    copy "%APK_DIR%\app-release.apk" "DailyDisciplineTracker-release.apk" >nul 2>&1
    echo Also copied to:
    echo   %CD%\DailyDisciplineTracker-release.apk
) else (
    echo APK files are in:
    echo   %CD%\%APK_DIR%\
    dir /b "%APK_DIR%\*.apk" 2>nul
)

echo.
echo To install on your device:
echo   adb install -r "%APK_DIR%\app-release.apk"
echo.
