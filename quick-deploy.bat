@echo off
REM BioShields Quick Deploy - Windows Batch Script
echo 🚀 BioShields Quick Deploy to Solana Devnet
echo ============================================

REM Check if WSL is available
wsl --version >nul 2>&1
if errorlevel 1 (
    echo ❌ WSL not found. Please install WSL first.
    echo Run: wsl --install
    pause
    exit /b 1
)

echo 🐧 Launching WSL Ubuntu for deployment...
echo.

REM Switch to WSL and run deployment
wsl bash -c "cd /mnt/c/Daaps/BioShields && echo '📁 Current directory:' && pwd && echo '🔧 Setting executable permissions...' && chmod +x deploy-devnet.sh && echo '🚀 Starting deployment...' && ./deploy-devnet.sh"

echo.
echo ✅ Deployment process completed!
echo 📄 Check deployment-info.json for details
echo 🌐 Visit Solana Explorer to view your program

pause