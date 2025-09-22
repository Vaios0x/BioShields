const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');

// Private key from user (base58 format)
const privateKeyBase58 = '4zS4n8UG8smHt4zzKgpv9qNTbNJLLb3zvPfUgC64NZFWkS4fpW34qxBvofRCYXNZxHhdsy5AFXMf1WfxCZo8NNJX';

try {
    // Decode private key from base58
    const privateKeyBuffer = bs58.default.decode(privateKeyBase58);

    // Create keypair from private key
    const keypair = Keypair.fromSecretKey(privateKeyBuffer);

    console.log('🔑 Wallet Address:', keypair.publicKey.toString());

    // Save keypair in Anchor format
    const keypairArray = Array.from(keypair.secretKey);
    fs.writeFileSync('./rust/wallet-keypair.json', JSON.stringify(keypairArray));

    console.log('💾 Wallet keypair saved to ./rust/wallet-keypair.json');
    console.log('✅ Ready for deployment!');

} catch (error) {
    console.error('❌ Error setting up wallet:', error.message);
}