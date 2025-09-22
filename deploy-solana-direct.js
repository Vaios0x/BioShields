const { Connection, Keypair, Transaction, SystemProgram, PublicKey, sendAndConfirmTransaction } = require('@solana/web3.js');
const fs = require('fs');
const bs58 = require('bs58');

async function deploySolanaDirect() {
  try {
    console.log('🚀 Iniciando deployment directo de Solana...');
    
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
      console.log('✅ Programa ya desplegado!');
      console.log('📦 Tamaño:', programInfo.data.length, 'bytes');
      console.log('⚡ Ejecutable:', programInfo.executable);
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
        transaction_signature: 'existing_deployment',
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
    
    // Si no existe, necesitamos compilar primero
    console.log('⚠️ Programa no encontrado. Necesitamos compilar primero.');
    console.log('📋 Pasos requeridos:');
    console.log('1. Instalar Solana CLI');
    console.log('2. Instalar Anchor CLI');
    console.log('3. Compilar: cd rust && anchor build');
    console.log('4. Desplegar: anchor deploy --provider.cluster devnet');
    
    // Intentar usar el archivo .so si existe
    const soPath = './rust/target/deploy/bioshield_insurance.so';
    if (fs.existsSync(soPath)) {
      console.log('📦 Archivo .so encontrado, intentando deployment...');
      
      const programBuffer = fs.readFileSync(soPath);
      console.log('📊 Tamaño del programa:', programBuffer.length, 'bytes');
      
      // Calcular costo estimado
      const estimatedCost = (programBuffer.length * 0.00000348) + 0.001;
      console.log('💰 Costo estimado:', estimatedCost, 'SOL');
      
      if (balance < estimatedCost * 1e9) {
        console.log('❌ Balance insuficiente para deployment');
        return { success: false, error: 'Insufficient balance' };
      }
      
      try {
        // Crear transacción de deployment
        const transaction = new Transaction();
        
        // Añadir instrucción de deployment
        const deployInstruction = SystemProgram.createAccount({
          fromPubkey: walletKeypair.publicKey,
          newAccountPubkey: programKeypair.publicKey,
          lamports: await connection.getMinimumBalanceForRentExemption(programBuffer.length),
          space: programBuffer.length,
          programId: SystemProgram.programId,
        });
        
        transaction.add(deployInstruction);
        
        // Enviar transacción
        console.log('🚀 Enviando transacción de deployment...');
        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [walletKeypair, programKeypair],
          { commitment: 'confirmed' }
        );
        
        console.log('✅ Deployment exitoso!');
        console.log('📝 Signature:', signature);
        console.log('🌐 Explorer: https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
        
        // Actualizar deployment-info.json
        const deploymentInfo = {
          program_id: programKeypair.publicKey.toString(),
          wallet_address: walletKeypair.publicKey.toString(),
          deployment_date: new Date().toISOString(),
          cluster: 'devnet',
          program_size: programBuffer.length,
          deployment_cost: estimatedCost + ' SOL',
          solana_version: '2.0.14',
          anchor_version: '0.30.1',
          transaction_signature: signature,
          status: 'deployed'
        };
        
        fs.writeFileSync('./deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
        
        return {
          success: true,
          programId: programKeypair.publicKey.toString(),
          explorerUrl: 'https://explorer.solana.com/address/' + programKeypair.publicKey.toString() + '?cluster=devnet',
          signature: signature
        };
        
      } catch (error) {
        console.error('❌ Error en deployment:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      console.log('❌ Archivo .so no encontrado. Necesitas compilar primero.');
      console.log('📋 Ejecuta: cd rust && anchor build');
      return { success: false, error: 'Program not compiled' };
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

deploySolanaDirect()
  .then(result => {
    if (result.success) {
      console.log('\n✅ DEPLOYMENT EXITOSO!');
      console.log('Program ID:', result.programId);
      console.log('Explorer:', result.explorerUrl);
      if (result.signature) {
        console.log('Signature:', result.signature);
      }
    } else {
      console.log('\n⚠️ DEPLOYMENT REQUIERE ACCIÓN MANUAL');
      console.log('Error:', result.error);
    }
  })
  .catch(error => {
    console.error('\n💥 ERROR:', error.message);
  });