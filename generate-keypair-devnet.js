#!/usr/bin/env node

// BioShields Keypair Generator for Solana devnet - September 2025
const fs = require('fs');
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58').default || require('bs58');

function generateKeypairFromBase58(base58PrivateKey) {
    try {
        console.log('🔑 Generating keypair from provided base58 private key...');

        // Decode the base58 private key
        const privateKeyBytes = bs58.decode(base58PrivateKey);

        // Create keypair from private key
        const keypair = Keypair.fromSecretKey(privateKeyBytes);

        console.log('✅ Keypair generated successfully!');
        console.log('📧 Public Key:', keypair.publicKey.toString());

        // Save keypair to file in the format Solana CLI expects
        const keypairData = Array.from(keypair.secretKey);
        fs.writeFileSync('./devnet-keypair.json', JSON.stringify(keypairData, null, 2));

        console.log('💾 Keypair saved to ./devnet-keypair.json');

        // Also save in byte array format for .env
        const byteArrayFormat = JSON.stringify(Array.from(keypair.secretKey));

        console.log('\n🎯 Configuration Summary:');
        console.log('========================');
        console.log('Public Key:', keypair.publicKey.toString());
        console.log('Private Key (bytes):', byteArrayFormat);
        console.log('Keypair file: ./devnet-keypair.json');

        return {
            publicKey: keypair.publicKey.toString(),
            secretKey: keypairData,
            secretKeyBytes: byteArrayFormat
        };

    } catch (error) {
        console.error('❌ Error generating keypair:', error.message);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    const base58PrivateKey = '4zS4n8UG8smHt4zzKgpv9qNTbNJLLb3zvPfUgC64NZFWkS4fpW34qxBvofRCYXNZxHhdsy5AFXMf1WfxCZo8NNJX';

    try {
        const result = generateKeypairFromBase58(base58PrivateKey);

        console.log('\n🚀 Ready for deployment!');
        console.log('Run: ./deploy-devnet.sh');

    } catch (error) {
        console.error('❌ Failed to generate keypair:', error.message);
        process.exit(1);
    }
}

module.exports = { generateKeypairFromBase58 };