#!/bin/bash

echo "🚀 BioShield Solana Deployment via WSL"
echo "======================================"

# Verificar si estamos en WSL
if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
    echo "❌ Este script debe ejecutarse en WSL"
    exit 1
fi

# Instalar Solana CLI si no está instalado
if ! command -v solana &> /dev/null; then
    echo "📦 Instalando Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
    export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"
fi

# Instalar Anchor CLI si no está instalado
if ! command -v anchor &> /dev/null; then
    echo "📦 Instalando Anchor CLI..."
    npm install -g @coral-xyz/anchor-cli
fi

# Configurar Solana para devnet
echo "🔧 Configurando Solana para devnet..."
solana config set --url devnet
solana config set --commitment confirmed

# Verificar configuración
echo "📋 Configuración actual:"
solana config get

# Verificar balance
WALLET_ADDRESS=$(solana address)
BALANCE=$(solana balance --lamports | cut -d' ' -f1)
echo "💰 Balance: $BALANCE lamports"

# Airdrop si es necesario
if [ "$BALANCE" -lt 1000000000 ]; then
    echo "💧 Solicitando airdrop..."
    solana airdrop 2
fi

# Navegar al directorio rust
cd rust

# Verificar archivos
if [ ! -f "Anchor.toml" ]; then
    echo "❌ Anchor.toml no encontrado"
    exit 1
fi

if [ ! -f "wallet-keypair.json" ]; then
    echo "❌ wallet-keypair.json no encontrado"
    exit 1
fi

if [ ! -f "program-keypair.json" ]; then
    echo "❌ program-keypair.json no encontrado"
    exit 1
fi

echo "✅ Archivos de configuración encontrados"

# Compilar programa
echo "🔨 Compilando programa..."
anchor build

if [ $? -ne 0 ]; then
    echo "❌ Error en compilación"
    exit 1
fi

echo "✅ Compilación exitosa"

# Desplegar programa
echo "🚀 Desplegando a devnet..."
anchor deploy --provider.cluster devnet

if [ $? -ne 0 ]; then
    echo "❌ Error en deployment"
    exit 1
fi

echo "✅ Deployment exitoso!"

# Obtener información del programa
PROGRAM_ID=$(solana address -k program-keypair.json)
echo "📋 Program ID: $PROGRAM_ID"
echo "🌐 Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"

# Verificar deployment
echo "🔍 Verificando deployment..."
solana program show $PROGRAM_ID --url devnet

echo "🎉 ¡Deployment completado exitosamente!"
