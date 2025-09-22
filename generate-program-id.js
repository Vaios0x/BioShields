const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Generate new program keypair
const programKeypair = Keypair.generate();
console.log('🔑 Generated Program ID:', programKeypair.publicKey.toString());

// Save keypair to file
const keypairArray = Array.from(programKeypair.secretKey);
fs.writeFileSync('./rust/program-keypair.json', JSON.stringify(keypairArray));

console.log('💾 Keypair saved to ./rust/program-keypair.json');
console.log('📋 Program ID for Anchor.toml and lib.rs:', programKeypair.publicKey.toString());