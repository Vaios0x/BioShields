#!/usr/bin/env node

// BioShields Keypair Generator for Solana devnet
const fs = require('fs');
const { Keypair } = require('@solana/web3.js');

function generateKeypairFromPrivateKey(privateKeyArray) {
    try {
        console.log('🔑 Generating keypair from provided private key...');

        // Convert string representation of array to actual array
        let privateKey;
        if (typeof privateKeyArray === 'string') {
            privateKey = JSON.parse(privateKeyArray);
        } else {
            privateKey = privateKeyArray;
        }

        // Create keypair from private key
        const keypair = Keypair.fromSecretKey(new Uint8Array(privateKey));

        console.log('✅ Keypair generated successfully!');
        console.log('📧 Public Key:', keypair.publicKey.toString());

        // Save keypair to file
        const keypairData = Array.from(keypair.secretKey);
        fs.writeFileSync('./devnet-keypair.json', JSON.stringify(keypairData, null, 2));

        console.log('💾 Keypair saved to ./devnet-keypair.json');

        return {
            publicKey: keypair.publicKey.toString(),
            secretKey: keypairData
        };

    } catch (error) {
        console.error('❌ Error generating keypair:', error.message);
        console.log('🆕 Generating new random keypair instead...');

        // Generate new random keypair as fallback
        const newKeypair = Keypair.generate();
        const secretKeyArray = Array.from(newKeypair.secretKey);

        fs.writeFileSync('./devnet-keypair.json', JSON.stringify(secretKeyArray, null, 2));

        console.log('✅ New keypair generated!');
        console.log('📧 Public Key:', newKeypair.publicKey.toString());
        console.log('💾 Keypair saved to ./devnet-keypair.json');
        console.log('⚠️ Please update your .env.devnet with the new private key:');
        console.log('SOLANA_PRIVATE_KEY=' + JSON.stringify(secretKeyArray));

        return {
            publicKey: newKeypair.publicKey.toString(),
            secretKey: secretKeyArray
        };
    }
}

// Main execution
if (require.main === module) {
    // Read private key from environment or use provided one
    const privateKeyFromEnv = process.env.SOLANA_PRIVATE_KEY;
    const providedPrivateKey = '[4,122,83,52,110,56,85,71,56,115,109,72,116,52,122,122,75,103,112,118,57,113,78,84,98,78,74,76,76,98,51,122,118,80,102,85,103,67,54,52,78,90,70,87,107,83,52,102,112,87,51,52,113,120,66,118,111,102,82,67,89,88,78,90,120,72,104,100,115,121,53,65,70,88,77,102,49,87,102,120,67,90,111,56,78,78,74,88]';

    const privateKey = privateKeyFromEnv || providedPrivateKey;
    const result = generateKeypairFromPrivateKey(privateKey);

    console.log('\n🎯 Setup Summary:');
    console.log('================');
    console.log('Public Key:', result.publicKey);
    console.log('Keypair file: ./devnet-keypair.json');
    console.log('\n🚀 Ready for deployment!');
    console.log('Run: ./deploy-devnet.sh');
}

module.exports = { generateKeypairFromPrivateKey };