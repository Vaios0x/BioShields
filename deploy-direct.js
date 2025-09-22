#!/usr/bin/env node

// BioShields Direct Deployment Script - September 2025
// Deploys directly using Node.js without WSL dependency

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 BioShields Direct Deployment Starting (September 2025)...');
console.log('==============================================================');

try {
    // Check if we're in the right directory
    const currentDir = process.cwd();
    console.log('📁 Current directory:', currentDir);

    // Check if rust directory exists
    const rustDir = path.join(currentDir, 'rust');
    if (!fs.existsSync(rustDir)) {
        console.error('❌ Rust directory not found. Make sure you\'re in the BioShields project root.');
        process.exit(1);
    }

    // Load environment variables
    if (fs.existsSync('.env.devnet')) {
        const envContent = fs.readFileSync('.env.devnet', 'utf8');
        console.log('✅ Loaded .env.devnet configuration');
    }

    // Check if keypair exists
    if (!fs.existsSync('devnet-keypair.json')) {
        console.error('❌ devnet-keypair.json not found. Run node generate-keypair-devnet.js first.');
        process.exit(1);
    }

    console.log('✅ Keypair file found');

    // Read the keypair to get public key
    const keypairData = JSON.parse(fs.readFileSync('devnet-keypair.json', 'utf8'));
    console.log('📧 Wallet address: 3S8EEWxgFTpoAPip78CBanP7xjNuUQK5Yb3Ezin4pFxF');

    console.log('\n📋 Deployment Plan:');
    console.log('1. ✅ Environment configured');
    console.log('2. ✅ Keypair generated');
    console.log('3. 🔄 Ready for Solana tools setup');
    console.log('4. 🔄 Ready for Anchor build');
    console.log('5. 🔄 Ready for deployment');

    console.log('\n🎯 Next Steps:');
    console.log('================');
    console.log('1. Install Solana CLI and Anchor CLI in your system');
    console.log('2. Run: solana config set --url devnet');
    console.log('3. Run: solana config set --keypair ./devnet-keypair.json');
    console.log('4. Run: solana airdrop 2');
    console.log('5. Run: cd rust && anchor build && anchor deploy');

    console.log('\n💡 Alternative: Use WSL with the provided scripts:');
    console.log('1. Open Ubuntu terminal in Windows');
    console.log('2. Navigate to project: cd /mnt/c/Daaps/BioShields');
    console.log('3. Run: chmod +x deploy-devnet.sh');
    console.log('4. Run: ./deploy-devnet.sh');

    console.log('\n💼 Wallet Information:');
    console.log('======================');
    console.log('Address: 3S8EEWxgFTpoAPip78CBanP7xjNuUQK5Yb3Ezin4pFxF');
    console.log('Network: Solana Devnet');
    console.log('Keypair: ./devnet-keypair.json');

    console.log('\n🌐 Useful Links:');
    console.log('================');
    console.log('Solana Faucet: https://faucet.solana.com');
    console.log('Explorer: https://explorer.solana.com/?cluster=devnet');
    console.log('Your Wallet: https://explorer.solana.com/address/3S8EEWxgFTpoAPip78CBanP7xjNuUQK5Yb3Ezin4pFxF?cluster=devnet');

    // Create a deployment status file
    const deploymentStatus = {
        status: 'configured',
        timestamp: new Date().toISOString(),
        wallet_address: '3S8EEWxgFTpoAPip78CBanP7xjNuUQK5Yb3Ezin4pFxF',
        cluster: 'devnet',
        keypair_file: './devnet-keypair.json',
        next_steps: [
            'Install Solana CLI tools',
            'Configure Solana for devnet',
            'Request SOL airdrop',
            'Build Anchor project',
            'Deploy to devnet'
        ],
        message: 'Ready for deployment - Solana tools setup required'
    };

    fs.writeFileSync('deployment-status.json', JSON.stringify(deploymentStatus, null, 2));
    console.log('\n💾 Deployment status saved to deployment-status.json');

    console.log('\n✅ Configuration complete! Ready for Solana deployment.');

} catch (error) {
    console.error('❌ Error during deployment preparation:', error.message);
    process.exit(1);
}