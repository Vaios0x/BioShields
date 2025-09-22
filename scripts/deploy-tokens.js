#!/usr/bin/env node

/**
 * BioShield Tokens Deployment Script
 * Senior Blockchain Developer Full Stack - September 2025
 * 
 * Este script crea y despliega los tokens $LIVES y $SHIELD en Solana
 */

const { 
  Connection, 
  PublicKey, 
  Keypair, 
  sendAndConfirmTransaction,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL 
} = require('@solana/web3.js');
const { 
  createMint, 
  createAccount, 
  mintTo, 
  getAccount,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} = require('@solana/spl-token');
const fs = require('fs');
const bs58 = require('bs58');

// Token Configuration
const TOKEN_CONFIG = {
  LIVES: {
    name: 'BioShield Lives Token',
    symbol: 'LIVES',
    decimals: 9,
    description: 'Utility token for BioShield Insurance platform with 50% premium discount',
    image: 'https://bioshield.insurance/tokens/lives.png',
    initialSupply: 1000000000, // 1 billion tokens
    maxSupply: 10000000000,    // 10 billion tokens max
  },
  SHIELD: {
    name: 'BioShield Shield Token',
    symbol: 'SHIELD',
    decimals: 9,
    description: 'Governance and liquidity reward token for BioShield Insurance',
    image: 'https://bioshield.insurance/tokens/shield.png',
    initialSupply: 500000000,  // 500 million tokens
    maxSupply: 5000000000,     // 5 billion tokens max
  }
};

async function deployTokens() {
    try {
        console.log('🚀 BioShield Tokens Deployment Starting...');
        console.log('================================================================');

        // Setup connection
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

        // Load wallet keypair
        const walletKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('./rust/wallet-keypair.json')))
        );

        console.log('🔑 Wallet Address:', walletKeypair.publicKey.toString());

        // Check wallet balance
        const walletBalance = await connection.getBalance(walletKeypair.publicKey);
        console.log('💰 Wallet Balance:', (walletBalance / LAMPORTS_PER_SOL).toFixed(4), 'SOL');

        if (walletBalance < 3 * LAMPORTS_PER_SOL) {
            console.log('💧 Requesting SOL airdrop...');
            try {
                const signature = await connection.requestAirdrop(walletKeypair.publicKey, 3 * LAMPORTS_PER_SOL);
                await connection.confirmTransaction(signature);
                console.log('✅ Airdrop successful');
            } catch (error) {
                console.log('⚠️  Airdrop failed, but continuing...');
            }
        }

        const deployedTokens = {};

        // Deploy $LIVES Token
        console.log('\n🟠 Deploying $LIVES Token...');
        const livesToken = await deployToken(
            connection,
            walletKeypair,
            TOKEN_CONFIG.LIVES,
            'LIVES'
        );
        deployedTokens.LIVES = livesToken;

        // Deploy $SHIELD Token
        console.log('\n🛡️ Deploying $SHIELD Token...');
        const shieldToken = await deployToken(
            connection,
            walletKeypair,
            TOKEN_CONFIG.SHIELD,
            'SHIELD'
        );
        deployedTokens.SHIELD = shieldToken;

        // Create token metadata
        console.log('\n📝 Creating token metadata...');
        await createTokenMetadata(connection, walletKeypair, deployedTokens);

        // Save deployment info
        const deploymentInfo = {
            timestamp: new Date().toISOString(),
            cluster: 'devnet',
            wallet: walletKeypair.publicKey.toString(),
            tokens: deployedTokens,
            explorer_urls: {
                lives: `https://explorer.solana.com/address/${deployedTokens.LIVES.mint}?cluster=devnet`,
                shield: `https://explorer.solana.com/address/${deployedTokens.SHIELD.mint}?cluster=devnet`
            }
        };

        fs.writeFileSync('./token-deployment.json', JSON.stringify(deploymentInfo, null, 2));
        console.log('💾 Token deployment info saved to token-deployment.json');

        // Update environment variables
        await updateEnvironmentVariables(deployedTokens);

        console.log('\n🎉 TOKEN DEPLOYMENT COMPLETED SUCCESSFULLY!');
        console.log('================================================================');
        console.log('🟠 $LIVES Token:', deployedTokens.LIVES.mint);
        console.log('🛡️ $SHIELD Token:', deployedTokens.SHIELD.mint);
        console.log('🌐 Explorer URLs:');
        console.log('   LIVES:', deploymentInfo.explorer_urls.lives);
        console.log('   SHIELD:', deploymentInfo.explorer_urls.shield);

        return deployedTokens;

    } catch (error) {
        console.error('❌ Token deployment failed:', error.message);
        throw error;
    }
}

async function deployToken(connection, wallet, config, tokenType) {
    try {
        console.log(`📦 Creating ${tokenType} token mint...`);
        
        // Create mint
        const mint = await createMint(
            connection,
            wallet,
            wallet.publicKey, // mint authority
            wallet.publicKey, // freeze authority
            config.decimals,
            undefined, // keypair (auto-generated)
            undefined, // confirmOptions
            TOKEN_PROGRAM_ID
        );

        console.log(`✅ ${tokenType} mint created:`, mint.toString());

        // Create associated token account for the wallet
        const tokenAccount = await createAccount(
            connection,
            wallet,
            mint,
            wallet.publicKey,
            undefined, // keypair (auto-generated)
            undefined, // confirmOptions
            TOKEN_PROGRAM_ID
        );

        console.log(`✅ ${tokenType} token account created:`, tokenAccount.toString());

        // Mint initial supply
        console.log(`🪙 Minting initial supply: ${config.initialSupply} ${tokenType}...`);
        const mintSignature = await mintTo(
            connection,
            wallet,
            mint,
            tokenAccount,
            wallet.publicKey,
            config.initialSupply * Math.pow(10, config.decimals),
            [],
            undefined,
            TOKEN_PROGRAM_ID
        );

        await connection.confirmTransaction(mintSignature);
        console.log(`✅ Initial supply minted: ${config.initialSupply} ${tokenType}`);

        // Get token account info
        const tokenAccountInfo = await getAccount(connection, tokenAccount);
        const mintInfo = await getMint(connection, mint);

        console.log(`📊 ${tokenType} Token Info:`);
        console.log(`   - Mint Address: ${mint.toString()}`);
        console.log(`   - Token Account: ${tokenAccount.toString()}`);
        console.log(`   - Supply: ${mintInfo.supply.toString()}`);
        console.log(`   - Decimals: ${mintInfo.decimals}`);
        console.log(`   - Wallet Balance: ${tokenAccountInfo.amount.toString()}`);

        return {
            mint: mint.toString(),
            tokenAccount: tokenAccount.toString(),
            supply: mintInfo.supply.toString(),
            decimals: mintInfo.decimals,
            balance: tokenAccountInfo.amount.toString(),
            config: config
        };

    } catch (error) {
        console.error(`❌ Failed to deploy ${tokenType} token:`, error.message);
        throw error;
    }
}

async function createTokenMetadata(connection, wallet, tokens) {
    try {
        // In a real implementation, this would create metadata on-chain
        // For now, we'll create JSON metadata files
        
        const metadata = {
            LIVES: {
                name: TOKEN_CONFIG.LIVES.name,
                symbol: TOKEN_CONFIG.LIVES.symbol,
                description: TOKEN_CONFIG.LIVES.description,
                image: TOKEN_CONFIG.LIVES.image,
                decimals: TOKEN_CONFIG.LIVES.decimals,
                mint: tokens.LIVES.mint,
                supply: tokens.LIVES.supply,
                attributes: [
                    { trait_type: 'Utility', value: 'Premium Discount' },
                    { trait_type: 'Discount', value: '50%' },
                    { trait_type: 'Network', value: 'Solana' },
                    { trait_type: 'Platform', value: 'BioShield Insurance' }
                ]
            },
            SHIELD: {
                name: TOKEN_CONFIG.SHIELD.name,
                symbol: TOKEN_CONFIG.SHIELD.symbol,
                description: TOKEN_CONFIG.SHIELD.description,
                image: TOKEN_CONFIG.SHIELD.image,
                decimals: TOKEN_CONFIG.SHIELD.decimals,
                mint: tokens.SHIELD.mint,
                supply: tokens.SHIELD.supply,
                attributes: [
                    { trait_type: 'Utility', value: 'Governance' },
                    { trait_type: 'Rewards', value: 'Liquidity Provider' },
                    { trait_type: 'APY', value: '12.5%' },
                    { trait_type: 'Network', value: 'Solana' },
                    { trait_type: 'Platform', value: 'BioShield Insurance' }
                ]
            }
        };

        // Save metadata files
        fs.writeFileSync('./tokens/lives-metadata.json', JSON.stringify(metadata.LIVES, null, 2));
        fs.writeFileSync('./tokens/shield-metadata.json', JSON.stringify(metadata.SHIELD, null, 2));

        console.log('✅ Token metadata created');

    } catch (error) {
        console.error('❌ Failed to create token metadata:', error.message);
        throw error;
    }
}

async function updateEnvironmentVariables(tokens) {
    try {
        console.log('🔧 Updating environment variables...');

        // Read current .env.local
        let envContent = '';
        if (fs.existsSync('.env.local')) {
            envContent = fs.readFileSync('.env.local', 'utf8');
        }

        // Update or add token addresses
        const updates = [
            `NEXT_PUBLIC_LIVES_TOKEN=${tokens.LIVES.mint}`,
            `NEXT_PUBLIC_SHIELD_TOKEN=${tokens.SHIELD.mint}`,
            `NEXT_PUBLIC_LIVES_TOKEN_ACCOUNT=${tokens.LIVES.tokenAccount}`,
            `NEXT_PUBLIC_SHIELD_TOKEN_ACCOUNT=${tokens.SHIELD.tokenAccount}`
        ];

        // Remove old token addresses if they exist
        updates.forEach(update => {
            const [key] = update.split('=');
            envContent = envContent.replace(new RegExp(`^${key}=.*$`, 'gm'), '');
        });

        // Add new token addresses
        envContent += '\n# BioShield Tokens (Auto-generated)\n';
        updates.forEach(update => {
            envContent += update + '\n';
        });

        // Write updated .env.local
        fs.writeFileSync('.env.local', envContent);
        console.log('✅ Environment variables updated');

    } catch (error) {
        console.error('❌ Failed to update environment variables:', error.message);
        throw error;
    }
}

// Create tokens directory if it doesn't exist
if (!fs.existsSync('./tokens')) {
    fs.mkdirSync('./tokens');
}

// Execute deployment
if (require.main === module) {
    deployTokens()
        .then((tokens) => {
            console.log('\n✅ TOKEN DEPLOYMENT COMPLETED');
            console.log('🟠 $LIVES Token:', tokens.LIVES.mint);
            console.log('🛡️ $SHIELD Token:', tokens.SHIELD.mint);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ TOKEN DEPLOYMENT FAILED');
            console.error('Error:', error.message);
            process.exit(1);
        });
}

module.exports = { deployTokens };
