#!/bin/bash

# BioShields Solana Devnet Deployment Script
# Complete Setup for September 2025 - Latest Solana v2.0.14 & Anchor 0.30.1

set -e

echo "🚀 BioShields Solana Devnet Deployment Starting (September 2025)..."
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.devnet ]; then
    source .env.devnet
    echo -e "${GREEN}✅ Loaded devnet environment variables${NC}"
else
    echo -e "${RED}❌ .env.devnet file not found${NC}"
    exit 1
fi

# Navigate to Rust workspace
cd rust

echo -e "${BLUE}📋 Verifying Solana configuration...${NC}"
solana config get

# Set devnet configuration
echo -e "${YELLOW}🔧 Configuring Solana for devnet...${NC}"
solana config set --url devnet
solana config set --commitment confirmed

# Check if we have a keypair
if [ ! -f ~/.config/solana/id.json ]; then
    echo -e "${YELLOW}🔑 Generating new keypair...${NC}"
    solana-keygen new --no-bip39-passphrase
else
    echo -e "${GREEN}✅ Using existing keypair${NC}"
fi

# Get current address and balance
WALLET_ADDRESS=$(solana address)
echo -e "${PURPLE}💼 Wallet Address: ${WALLET_ADDRESS}${NC}"

BALANCE=$(solana balance --lamports | cut -d' ' -f1)
echo -e "${CYAN}💰 Current Balance: ${BALANCE} lamports${NC}"

# Airdrop SOL if balance is low (less than 1 SOL = 1000000000 lamports)
if [ "$BALANCE" -lt 1000000000 ]; then
    echo -e "${YELLOW}💧 Requesting SOL airdrop...${NC}"
    solana airdrop 2 || {
        echo -e "${YELLOW}⚠️ Airdrop failed. Trying web faucet...${NC}"
        echo -e "${CYAN}Visit: https://faucet.solana.com${NC}"
        echo -e "${CYAN}Enter your address: ${WALLET_ADDRESS}${NC}"
        read -p "Press Enter after requesting tokens from web faucet..."
    }
fi

# Build the program
echo -e "${BLUE}🔨 Building BioShield Insurance program...${NC}"
anchor build

# Generate program keypair if it doesn't exist
PROGRAM_KEYPAIR_PATH="target/deploy/bioshield_insurance-keypair.json"
if [ ! -f "$PROGRAM_KEYPAIR_PATH" ]; then
    echo -e "${YELLOW}🆔 Generating program keypair...${NC}"
    solana-keygen new --no-bip39-passphrase -o "$PROGRAM_KEYPAIR_PATH"
fi

# Get the program ID
PROGRAM_ID=$(solana address -k $PROGRAM_KEYPAIR_PATH)
echo -e "${PURPLE}🆔 Program ID: ${PROGRAM_ID}${NC}"

# Update Anchor.toml with correct program ID
echo -e "${BLUE}📝 Updating Anchor.toml with program ID...${NC}"
sed -i "s/bioshield_insurance = \".*\"/bioshield_insurance = \"$PROGRAM_ID\"/" Anchor.toml

# Update lib.rs with correct program ID
LIB_RS_PATH="programs/bioshield-insurance/src/lib.rs"
if [ -f "$LIB_RS_PATH" ]; then
    echo -e "${BLUE}📝 Updating lib.rs with program ID...${NC}"
    sed -i "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" "$LIB_RS_PATH"
fi

# Rebuild with updated program ID
echo -e "${BLUE}🔨 Rebuilding with updated program ID...${NC}"
anchor build

# Calculate deployment cost
PROGRAM_SIZE=$(stat -c%s "target/deploy/bioshield_insurance.so")
DEPLOYMENT_COST=$(echo "scale=9; ($PROGRAM_SIZE * 0.00000348) + 0.001" | bc -l)
echo -e "${CYAN}📊 Program size: ${PROGRAM_SIZE} bytes${NC}"
echo -e "${CYAN}💰 Estimated deployment cost: ${DEPLOYMENT_COST} SOL${NC}"

# Check if we have enough balance for deployment
CURRENT_BALANCE_SOL=$(echo "scale=9; $BALANCE / 1000000000" | bc -l)
if (( $(echo "$CURRENT_BALANCE_SOL < $DEPLOYMENT_COST" | bc -l) )); then
    echo -e "${RED}❌ Insufficient balance for deployment${NC}"
    echo -e "${YELLOW}💧 Requesting additional SOL...${NC}"
    solana airdrop 2
fi

# Deploy to devnet with priority fees (September 2025 optimized)
echo -e "${GREEN}🚀 Deploying BioShield Insurance to Solana devnet (v2.0.14)...${NC}"
echo -e "${YELLOW}⏳ This may take a few minutes...${NC}"

# Use new deployment method for Solana v2.0.14
solana program deploy \
    target/deploy/bioshield_insurance.so \
    --program-id $PROGRAM_KEYPAIR_PATH \
    --max-sign-attempts 100 \
    --with-compute-unit-price ${PRIORITY_FEE:-10000} \
    --use-rpc || {

    echo -e "${RED}❌ Initial deployment failed. Retrying with optimized settings...${NC}"
    solana program deploy \
        target/deploy/bioshield_insurance.so \
        --program-id $PROGRAM_KEYPAIR_PATH \
        --max-sign-attempts 200 \
        --with-compute-unit-price ${MAX_PRIORITY_FEE:-100000} \
        --use-rpc
}

echo -e "${GREEN}✅ Deployment successful!${NC}"

# Verify deployment
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
solana program show $PROGRAM_ID --url devnet

# Save deployment info
DEPLOYMENT_INFO="{
    \"program_id\": \"$PROGRAM_ID\",
    \"wallet_address\": \"$WALLET_ADDRESS\",
    \"deployment_date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"cluster\": \"devnet\",
    \"program_size\": $PROGRAM_SIZE,
    \"deployment_cost\": \"$DEPLOYMENT_COST\",
    \"solana_version\": \"$(solana --version)\",
    \"anchor_version\": \"$(anchor --version)\"
}"

echo "$DEPLOYMENT_INFO" > ../deployment-info.json
echo -e "${GREEN}💾 Deployment info saved to deployment-info.json${NC}"

# Generate IDL
if command -v anchor &> /dev/null; then
    echo -e "${BLUE}📜 Generating IDL...${NC}"
    anchor idl init $PROGRAM_ID --filepath target/idl/bioshield_insurance.json || {
        echo -e "${YELLOW}⚠️ IDL generation failed. This is normal for first-time deployments.${NC}"
    }
fi

echo -e "${GREEN}🎉 BioShield Insurance deployment complete!${NC}"
echo -e "${CYAN}================================================${NC}"
echo -e "${PURPLE}📊 Deployment Summary:${NC}"
echo -e "${WHITE}Program ID: ${PROGRAM_ID}${NC}"
echo -e "${WHITE}Cluster: devnet${NC}"
echo -e "${WHITE}Wallet: ${WALLET_ADDRESS}${NC}"
echo -e "${WHITE}Explorer: https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet${NC}"
echo -e "${WHITE}Program Size: ${PROGRAM_SIZE} bytes${NC}"
echo -e "${CYAN}================================================${NC}"

# Run tests if available
if [ -f "tests/bioshield-insurance.ts" ]; then
    echo -e "${BLUE}🧪 Running tests...${NC}"
    anchor test --provider.cluster devnet || {
        echo -e "${YELLOW}⚠️ Tests failed. Check test configuration.${NC}"
    }
fi

echo -e "${GREEN}✅ All done! Your BioShield Insurance program is live on Solana devnet.${NC}"