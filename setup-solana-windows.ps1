# BioShields Solana Development Environment Setup for Windows
# Complete Setup for September 2025 - Updated with latest Solana tools
# Run this script in PowerShell as Administrator

Write-Host "🚀 Setting up Solana development environment for BioShields on Windows (September 2025)..." -ForegroundColor Green

# Check if WSL is installed
try {
    $wslStatus = wsl --status 2>$null
    Write-Host "✅ WSL is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ WSL not found. Installing WSL..." -ForegroundColor Red
    wsl --install
    Write-Host "⚠️ Please restart your computer after WSL installation completes, then run this script again." -ForegroundColor Yellow
    exit
}

# Install Windows Terminal if not present
try {
    Get-AppxPackage -Name Microsoft.WindowsTerminal | Out-Null
    Write-Host "✅ Windows Terminal is installed" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Windows Terminal..." -ForegroundColor Yellow
    winget install Microsoft.WindowsTerminal
}

Write-Host "`n🐧 Now switching to WSL for Solana tools installation..." -ForegroundColor Cyan
Write-Host "The following commands will be executed in Ubuntu WSL:" -ForegroundColor Yellow

# Create a script for WSL execution
$wslScript = @"
#!/bin/bash
set -e

echo "🔧 Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "📦 Installing build dependencies..."
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    pkg-config \
    libudev-dev \
    libssl-dev \
    ca-certificates \
    gnupg \
    lsb-release

echo "🦀 Installing Rust..."
if ! command -v cargo &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
    echo 'source ~/.cargo/env' >> ~/.bashrc
else
    echo "✅ Rust is already installed"
fi

echo "☀️ Installing Solana CLI (September 2025 version)..."
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL https://release.anza.xyz/v2.0.14/install)"
    echo 'export PATH="\$HOME/.local/share/solana/install/active_release/bin:\$PATH"' >> ~/.bashrc
    export PATH="\$HOME/.local/share/solana/install/active_release/bin:\$PATH"
else
    echo "✅ Solana CLI is already installed"
    echo "🔄 Updating to latest version..."
    agave-install update
fi

echo "⚓ Installing Anchor CLI (September 2025 version)..."
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install 0.30.1
    avm use 0.30.1
else
    echo "✅ Anchor CLI is already installed"
    echo "🔄 Updating to September 2025 compatible version..."
    avm install 0.30.1
    avm use 0.30.1
fi

echo "🔧 Installing Node.js and Yarn..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    npm install -g yarn
else
    echo "✅ Node.js is already installed"
fi

echo "✅ Installation complete! Versions:"
echo "Rust: \$(rustc --version)"
echo "Solana: \$(solana --version)"
echo "Anchor: \$(anchor --version)"
echo "Node.js: \$(node --version)"
echo "Yarn: \$(yarn --version)"

echo "🔑 Configuring Solana for devnet..."
solana config set --url devnet
echo "✅ Solana configured for devnet"

echo "🎯 Setup complete! You can now develop Solana programs in WSL."
echo "📁 Navigate to your project: cd /mnt/c/Daaps/BioShields"
"@

# Write the script to a temporary file and execute in WSL
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
$wslScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "Executing setup in WSL..." -ForegroundColor Cyan
wsl bash $tempScript

# Clean up
Remove-Item $tempScript

Write-Host "`n🎉 Setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open Windows Terminal" -ForegroundColor White
Write-Host "2. Select Ubuntu tab" -ForegroundColor White
Write-Host "3. Navigate to: cd /mnt/c/Daaps/BioShields" -ForegroundColor White
Write-Host "4. Run: ./deploy-devnet.sh" -ForegroundColor White