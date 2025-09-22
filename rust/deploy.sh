#!/bin/sh

# Configurar Solana CLI
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Configurar para devnet
solana config set --url devnet

# Configurar keypair
solana config set --keypair ./devnet-keypair.json

# Verificar wallet
WALLET_ADDRESS=$(solana address)
echo "Tu wallet: $WALLET_ADDRESS"

# Obtener SOL de prueba
BALANCE=$(solana balance --lamports)
if [ "$BALANCE" -lt 1000000000 ]; then
    echo "Solicitando airdrop de 2 SOL..."
    solana airdrop 2
    sleep 5
fi

# Generar Program ID
PROGRAM_ID=$(solana address -k target/deploy/bioshield_insurance-keypair.json)
echo "Program ID: $PROGRAM_ID"

# Actualizar Anchor.toml
sed -i.bak "s/bioshield_insurance = \".*\"/bioshield_insurance = \"$PROGRAM_ID\"/" Anchor.toml

# Actualizar lib.rs
sed -i.bak "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/bioshield-insurance/src/lib.rs

# Build del programa
echo "Building programa..."
anchor build

# Deploy del programa
echo "Deploying programa a devnet..."
anchor deploy --provider.cluster devnet

# Verificar deployment
echo "Verificando deployment..."
solana program show $PROGRAM_ID --url devnet

echo "Deployment completado!"
echo "Program ID: $PROGRAM_ID"
echo "Wallet: $WALLET_ADDRESS"
echo "Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
