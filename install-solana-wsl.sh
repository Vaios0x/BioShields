#!/bin/bash

# BioShields Solana Installation Script for WSL
# September 2025 - Latest Solana v2.0.14 & Anchor 0.30.1

set -e

echo "🚀 Installing Solana development tools in WSL for BioShields..."
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Update system packages
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install required dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
sudo apt install -y curl build-essential pkg-config libssl-dev libudev-dev

# Install Rust
echo -e "${BLUE}🦀 Installing Rust...${NC}"
if ! command -v rustc &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source ~/.cargo/env
    echo -e "${GREEN}✅ Rust installed successfully${NC}"
else
    echo -e "${GREEN}✅ Rust already installed${NC}"
fi

# Install Solana CLI
echo -e "${BLUE}⛓️ Installing Solana CLI v2.0.14...${NC}"
if ! command -v solana &> /dev/null; then
    sh -c "$(curl -sSfL https://release.solana.com/v2.0.14/install)"
    echo 'export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"' >> ~/.bashrc
    source ~/.bashrc
    echo -e "${GREEN}✅ Solana CLI installed successfully${NC}"
else
    echo -e "${GREEN}✅ Solana CLI already installed${NC}"
fi

# Install Anchor
echo -e "${BLUE}⚓ Installing Anchor v0.30.1...${NC}"
if ! command -v anchor &> /dev/null; then
    cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
    avm install 0.30.1
    avm use 0.30.1
    echo 'export PATH="$HOME/.avm/bin:$PATH"' >> ~/.bashrc
    source ~/.bashrc
    echo -e "${GREEN}✅ Anchor installed successfully${NC}"
else
    echo -e "${GREEN}✅ Anchor already installed${NC}"
fi

# Install Node.js and npm (for Anchor tests)
echo -e "${BLUE}📦 Installing Node.js...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo -e "${GREEN}✅ Node.js installed successfully${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed${NC}"
fi

# Install Yarn
echo -e "${BLUE}📦 Installing Yarn...${NC}"
if ! command -v yarn &> /dev/null; then
    npm install -g yarn
    echo -e "${GREEN}✅ Yarn installed successfully${NC}"
else
    echo -e "${GREEN}✅ Yarn already installed${NC}"
fi

# Configure Solana for devnet
echo -e "${BLUE}🔧 Configuring Solana for devnet...${NC}"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
solana config set --url devnet
solana config set --commitment confirmed

# Generate keypair if it doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo -e "${YELLOW}🔑 Generating new keypair...${NC}"
    solana-keygen new --no-bip39-passphrase
else
    echo -e "${GREEN}✅ Using existing keypair${NC}"
fi

# Get wallet address
WALLET_ADDRESS=$(solana address)
echo -e "${PURPLE}💼 Wallet Address: ${WALLET_ADDRESS}${NC}"

# Check balance and request airdrop if needed
BALANCE=$(solana balance --lamports | cut -d' ' -f1)
echo -e "${CYAN}💰 Current Balance: ${BALANCE} lamports${NC}"

if [ "$BALANCE" -lt 1000000000 ]; then
    echo -e "${YELLOW}💧 Requesting SOL airdrop...${NC}"
    solana airdrop 2 || {
        echo -e "${YELLOW}⚠️ Airdrop failed. You may need to use the web faucet.${NC}"
        echo -e "${CYAN}Visit: https://faucet.solana.com${NC}"
        echo -e "${CYAN}Enter your address: ${WALLET_ADDRESS}${NC}"
    }
fi

# Verify installations
echo -e "${BLUE}🔍 Verifying installations...${NC}"
echo -e "${GREEN}Rust: $(rustc --version)${NC}"
echo -e "${GREEN}Solana: $(solana --version)${NC}"
echo -e "${GREEN}Anchor: $(anchor --version)${NC}"
echo -e "${GREEN}Node.js: $(node --version)${NC}"
echo -e "${GREEN}Yarn: $(yarn --version)${NC}"

echo -e "${GREEN}🎉 Solana development environment setup complete!${NC}"
echo -e "${CYAN}================================================${NC}"
echo -e "${PURPLE}📊 Setup Summary:${NC}"
echo -e "${WHITE}Wallet Address: ${WALLET_ADDRESS}${NC}"
echo -e "${WHITE}Cluster: devnet${NC}"
echo -e "${WHITE}Solana Version: $(solana --version)${NC}"
echo -e "${WHITE}Anchor Version: $(anchor --version)${NC}"
echo -e "${CYAN}================================================${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "${WHITE}1. Navigate to your project: cd /mnt/c/Daaps/BioShields/rust${NC}"
echo -e "${WHITE}2. Run deployment: ./deploy.sh${NC}"
echo -e "${WHITE}3. Or use the full deployment script: ../deploy-devnet.sh${NC}"


