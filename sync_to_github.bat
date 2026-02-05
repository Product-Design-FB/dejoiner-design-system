@echo off
setlocal
echo ==========================================
echo   DEJOINER GITHUB SYNC UTILITY (V2)
echo ==========================================
echo.

:: 1. Try standard Git
set GIT_CMD=git
where git >nul 2>nul
if %ERRORLEVEL% equ 0 goto :FOUND_GIT

:: 2. Try GitHub Desktop Embedded Git
echo [INFO] Git not in PATH. Checking GitHub Desktop...
if exist "C:\Users\hardi\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd\git.exe" (
    set "GIT_CMD=C:\Users\hardi\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd\git.exe"
    goto :FOUND_GIT
)

:: 3. Failed
echo [ERROR] Could not find Git installed on this system.
echo Please install from: https://git-scm.com/download/win
pause
exit /b

:FOUND_GIT
echo [INFO] Using Git at: "%GIT_CMD%"
echo.

echo [1/5] Initializing Git repository...
"%GIT_CMD%" init

echo [2/5] Adding all files...
"%GIT_CMD%" add .

echo [3/5] Committing changes...
"%GIT_CMD%" commit -m "feat: Implement Dejoiner Design System V2"

echo [4/5] Renaming branch to main...
"%GIT_CMD%" branch -M main

echo [5/5] Adding remote and pushing...
"%GIT_CMD%" remote remove origin >nul 2>nul
"%GIT_CMD%" remote add origin https://github.com/Product-Design-FB/dejoiner-design-system.git
"%GIT_CMD%" push -u origin main

echo.
echo ==========================================
echo   SUCCESS! Project synced to GitHub.
echo ==========================================
echo.
pause
