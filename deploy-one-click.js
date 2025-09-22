// deploy-one-click.js
const { spawn } = require('child_process');
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');

const PRIVATE_KEY = '4zS4n8UG8smHt4zzKgpv9qNTbNJLLb3zvPfUgC64NZFWkS4fpW34qxBvofRCYXNZxHhdsy5AFXMf1WfxCZo8NNJX'; // ← CAMBIAR AQUÍ

async function deployOneClick() {
  try {
    // 1. Generar Program ID
    const programKeypair = Keypair.generate();
    const programId = programKeypair.publicKey.toString();
    fs.writeFileSync('./rust/program-keypair.json',
      JSON.stringify(Array.from(programKeypair.secretKey)));

    // 2. Setup wallet
    const walletKeypair = Keypair.fromSecretKey(bs58.default.decode(PRIVATE_KEY));
    fs.writeFileSync('./rust/wallet-keypair.json',
      JSON.stringify(Array.from(walletKeypair.secretKey)));

    // 3. Actualizar declare_id! en lib.rs
    let libContent = fs.readFileSync('./rust/programs/bioshield-insurance/src/lib.rs', 'utf8');
    libContent = libContent.replace(/declare_id!\(".*"\);/, `declare_id!("${programId}");`);
    fs.writeFileSync('./rust/programs/bioshield-insurance/src/lib.rs', libContent);

    // 4. Actualizar Anchor.toml
    let anchorContent = fs.readFileSync('./rust/Anchor.toml', 'utf8');
    anchorContent = anchorContent.replace(/bioshield_insurance = ".*"/g, `bioshield_insurance = "${programId}"`);
    fs.writeFileSync('./rust/Anchor.toml', anchorContent);

    console.log('✅ Configuración completada');
    console.log('📋 Program ID:', programId);
    console.log('🔑 Wallet:', walletKeypair.publicKey.toString());
    console.log('\n🚀 ¡Ahora ejecuta: cd rust && anchor build && anchor deploy!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deployOneClick();
