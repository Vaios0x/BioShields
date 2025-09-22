const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');

async function verifyDeployment() {
  try {
    console.log('🔍 Verificando deployment...');

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

    const programKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync('./rust/program-keypair.json')))
    );

    const programInfo = await connection.getAccountInfo(programKeypair.publicKey);

    if (!programInfo) {
      throw new Error('Programa no encontrado en devnet');
    }

    console.log('✅ Programa verificado en devnet');
    console.log('📦 Tamaño:', programInfo.data.length, 'bytes');
    console.log('⚡ Ejecutable:', programInfo.executable);
    console.log('🌐 Explorer:',
      `https://explorer.solana.com/address/${programKeypair.publicKey.toString()}?cluster=devnet`);

    return true;
  } catch (error) {
    console.error('❌ Verificación falló:', error.message);
    return false;
  }
}

verifyDeployment();
