const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

const programKeypair = Keypair.generate();
console.log('🔑 Program ID generado:', programKeypair.publicKey.toString());

const keypairArray = Array.from(programKeypair.secretKey);
fs.writeFileSync('./rust/program-keypair.json', JSON.stringify(keypairArray));

console.log('💾 Keypair guardado en ./rust/program-keypair.json');
console.log('📋 Program ID para actualizar:', programKeypair.publicKey.toString());