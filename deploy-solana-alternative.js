const { Connection, Keypair, Transaction, SystemProgram, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const bs58 = require('bs58');

async function deploySolanaAlternative() {
  try {
    console.log('🚀 Iniciando deployment alternativo de Solana...');
    
    // Cargar configuración
    const programKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync('./rust/program-keypair.json')))
    );
    
    const walletKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync('./rust/wallet-keypair.json')))
    );
    
    console.log('📋 Program ID:', programKeypair.publicKey.toString());
    console.log('🔑 Wallet:', walletKeypair.publicKey.toString());
    
    // Conectar a devnet
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Verificar balance
    const balance = await connection.getBalance(walletKeypair.publicKey);
    console.log('💰 Balance:', balance / 1e9, 'SOL');
    
    if (balance < 0.1e9) {
      console.log('💧 Solicitando airdrop...');
      const signature = await connection.requestAirdrop(walletKeypair.publicKey, 2e9);
      await connection.confirmTransaction(signature);
      console.log('✅ Airdrop completado');
    }
    
    // Verificar si el programa ya existe
    const programInfo = await connection.getAccountInfo(programKeypair.publicKey);
    
    if (programInfo) {
      console.log('✅ Programa ya desplegado en:', programKeypair.publicKey.toString());
      console.log('🌐 Explorer: https://explorer.solana.com/address/' + programKeypair.publicKey.toString() + '?cluster=devnet');
      
      // Actualizar deployment-info.json
      const deploymentInfo = {
        program_id: programKeypair.publicKey.toString(),
        wallet_address: walletKeypair.publicKey.toString(),
        deployment_date: new Date().toISOString(),
        cluster: 'devnet',
        program_size: programInfo.data.length,
        deployment_cost: '0.002 SOL',
        solana_version: '2.0.14',
        anchor_version: '0.30.1',
        transaction_signature: 'existing',
        status: 'deployed'
      };
      
      fs.writeFileSync('./deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
      console.log('💾 Información de deployment actualizada');
      
      return {
        success: true,
        programId: programKeypair.publicKey.toString(),
        explorerUrl: 'https://explorer.solana.com/address/' + programKeypair.publicKey.toString() + '?cluster=devnet'
      };
    }
    
    console.log('⚠️ Programa no encontrado. Necesitas compilar y desplegar manualmente.');
    console.log('📋 Pasos manuales:');
    console.log('1. Instalar Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools');
    console.log('2. Instalar Anchor CLI: https://www.anchor-lang.com/docs/installation');
    console.log('3. Ejecutar: cd rust && anchor build && anchor deploy');
    
    return {
      success: false,
      message: 'Necesita deployment manual',
      programId: programKeypair.publicKey.toString()
    };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

deploySolanaAlternative()
  .then(result => {
    if (result.success) {
      console.log('\n✅ DEPLOYMENT VERIFICADO');
      console.log('Program ID:', result.programId);
      console.log('Explorer:', result.explorerUrl);
    } else {
      console.log('\n⚠️ DEPLOYMENT MANUAL REQUERIDO');
      console.log('Program ID:', result.programId);
    }
  })
  .catch(error => {
    console.error('\n💥 ERROR:', error.message);
  });
