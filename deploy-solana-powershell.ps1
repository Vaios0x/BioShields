# BioShield Solana Deployment via PowerShell
Write-Host "🚀 BioShield Solana Deployment via PowerShell" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Verificar si Node.js está instalado
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar si Rust está instalado
if (!(Get-Command rustc -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Rust no está instalado" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js y Rust están instalados" -ForegroundColor Green

# Instalar Solana CLI si no está instalado
if (!(Get-Command solana -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Instalando Solana CLI..." -ForegroundColor Yellow
    
    # Descargar e instalar Solana CLI
    $solanaInstaller = "solana-install.exe"
    if (!(Test-Path $solanaInstaller)) {
        Invoke-WebRequest -Uri "https://github.com/solana-labs/solana/releases/download/v1.18.4/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile $solanaInstaller
    }
    
    # Ejecutar instalador
    Start-Process -FilePath $solanaInstaller -ArgumentList "init" -Wait
    
    # Agregar al PATH
    $solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
    if (Test-Path $solanaPath) {
        $env:PATH += ";$solanaPath"
    }
}

# Instalar Anchor CLI si no está instalado
if (!(Get-Command anchor -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Instalando Anchor CLI..." -ForegroundColor Yellow
    npm install -g @coral-xyz/anchor-cli
}

# Verificar instalación
Write-Host "🔍 Verificando instalación..." -ForegroundColor Blue
try {
    $solanaVersion = & solana --version 2>$null
    Write-Host "✅ Solana CLI: $solanaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Solana CLI no disponible" -ForegroundColor Red
    exit 1
}

try {
    $anchorVersion = & anchor --version 2>$null
    Write-Host "✅ Anchor CLI: $anchorVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Anchor CLI no disponible" -ForegroundColor Red
    exit 1
}

# Configurar Solana para devnet
Write-Host "🔧 Configurando Solana para devnet..." -ForegroundColor Blue
& solana config set --url devnet
& solana config set --commitment confirmed

# Verificar configuración
Write-Host "📋 Configuración actual:" -ForegroundColor Blue
& solana config get

# Verificar balance
$walletAddress = & solana address
$balance = & solana balance --lamports | ForEach-Object { $_.Split(' ')[0] }
Write-Host "💰 Balance: $balance lamports" -ForegroundColor Cyan

# Airdrop si es necesario
if ([int]$balance -lt 1000000000) {
    Write-Host "💧 Solicitando airdrop..." -ForegroundColor Yellow
    & solana airdrop 2
}

# Navegar al directorio rust
Set-Location rust

# Verificar archivos
$requiredFiles = @("Anchor.toml", "wallet-keypair.json", "program-keypair.json")
foreach ($file in $requiredFiles) {
    if (!(Test-Path $file)) {
        Write-Host "❌ $file no encontrado" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Archivos de configuración encontrados" -ForegroundColor Green

# Compilar programa
Write-Host "🔨 Compilando programa..." -ForegroundColor Blue
& anchor build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en compilación" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Compilación exitosa" -ForegroundColor Green

# Desplegar programa
Write-Host "🚀 Desplegando a devnet..." -ForegroundColor Blue
& anchor deploy --provider.cluster devnet

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error en deployment" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment exitoso!" -ForegroundColor Green

# Obtener información del programa
$programId = & solana address -k program-keypair.json
Write-Host "📋 Program ID: $programId" -ForegroundColor Magenta
Write-Host "🌐 Explorer: https://explorer.solana.com/address/$programId?cluster=devnet" -ForegroundColor Cyan

# Verificar deployment
Write-Host "🔍 Verificando deployment..." -ForegroundColor Blue
& solana program show $programId --url devnet

Write-Host "🎉 ¡Deployment completado exitosamente!" -ForegroundColor Green
