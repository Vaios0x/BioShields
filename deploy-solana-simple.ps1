# BioShield Solana Deployment - Simple Version
Write-Host "Starting BioShield Solana Deployment..." -ForegroundColor Green

# Check if Node.js is installed
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js not installed" -ForegroundColor Red
    exit 1
}

# Check if Rust is installed
if (!(Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "Rust not installed" -ForegroundColor Red
    exit 1
}

Write-Host "Node.js and Rust are installed" -ForegroundColor Green

# Install Solana CLI if not installed
if (!(Get-Command solana -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Solana CLI..." -ForegroundColor Yellow
    
    $solanaInstaller = "solana-install.exe"
    if (!(Test-Path $solanaInstaller)) {
        Invoke-WebRequest -Uri "https://github.com/solana-labs/solana/releases/download/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile $solanaInstaller
    }
    
    Start-Process -FilePath $solanaInstaller -ArgumentList "init" -Wait
}

# Install Anchor CLI if not installed
if (!(Get-Command anchor -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Anchor CLI..." -ForegroundColor Yellow
    npm install -g @coral-xyz/anchor-cli
}

# Configure Solana for devnet
Write-Host "Configuring Solana for devnet..." -ForegroundColor Blue
& solana config set --url devnet
& solana config set --commitment confirmed

# Check balance
$walletAddress = & solana address
$balance = & solana balance --lamports | ForEach-Object { $_.Split(' ')[0] }
Write-Host "Balance: $balance lamports" -ForegroundColor Cyan

# Airdrop if needed
if ([int]$balance -lt 1000000000) {
    Write-Host "Requesting airdrop..." -ForegroundColor Yellow
    & solana airdrop 2
}

# Navigate to rust directory
Set-Location rust

# Check required files
$requiredFiles = @("Anchor.toml", "wallet-keypair.json", "program-keypair.json")
foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        Write-Host "$file not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Configuration files found" -ForegroundColor Green

# Build program
Write-Host "Building program..." -ForegroundColor Blue
& anchor build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful" -ForegroundColor Green

# Deploy program
Write-Host "Deploying to devnet..." -ForegroundColor Blue
& anchor deploy --provider.cluster devnet

if ($LASTEXITCODE -ne 0) {
    Write-Host "Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "Deployment successful!" -ForegroundColor Green

# Get program info
$programId = & solana address -k program-keypair.json
Write-Host "Program ID: $programId" -ForegroundColor Magenta
Write-Host "Explorer: https://explorer.solana.com/address/$programId?cluster=devnet" -ForegroundColor Cyan

# Verify deployment
Write-Host "Verifying deployment..." -ForegroundColor Blue
& solana program show $programId --url devnet

Write-Host "Deployment completed successfully!" -ForegroundColor Green
