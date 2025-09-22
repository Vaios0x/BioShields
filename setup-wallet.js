const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');

// TU CLAVE PRIVADA AQUÍ (base58 format)
const privateKeyBase58 = '4zS4n8UG8smHt4zzKgpv9qNTbNJLLb3zvPfUgC64NZFWkS4fpW34qxBvofRCYXNZxHhdsy5AFXMf1WfxCZo8NNJX';

try {
  const privateKeyBuffer = bs58.default.decode(privateKeyBase58);
  const keypair = Keypair.fromSecretKey(privateKeyBuffer);

  console.log('🔑 Wallet Address:', keypair.publicKey.toString());

  const keypairArray = Array.from(keypair.secretKey);
  fs.writeFileSync('./rust/wallet-keypair.json', JSON.stringify(keypairArray));

  console.log('💾 Wallet configurado correctamente');

} catch (error) {
  console.error('❌ Error:', error.message);
}