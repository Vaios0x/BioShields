const { spawn } = require('child_process');
const fs = require('fs');
const { Keypair } = require('@solana/web3.js');

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Ejecutando: ${command} ${args.join(' ')}`);

    const proc = spawn(command, args, {
      stdio: 'pipe',
      shell: true,
      ...options
    });

    let output = '';
    let error = '';

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      process.stderr.write(text);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ output, error, code });
      } else {
        reject(new Error(`Comando falló con código ${code}: ${error}`));
      }
    });
  });
}

async function deployProgram() {
  try {
    console.log('🚀 Iniciando deployment...');

    // Cambiar al directorio rust
    process.chdir('./rust');

    // Verificar archivos requeridos
    const requiredFiles = [
      'Anchor.toml',
      'wallet-keypair.json',
      'program-keypair.json'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Archivo requerido faltante: ${file}`);
      }
    }

    console.log('✅ Todos los archivos requeridos presentes');

    // Build
    console.log('🔨 Compilando programa...');
    await runCommand('anchor', ['build']);

    // Deploy
    console.log('🚀 Desplegando a devnet...');
    await runCommand('anchor', ['deploy', '--provider.cluster', 'devnet']);

    // Obtener Program ID
    const programKeypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync('./program-keypair.json')))
    );

    console.log('🎉 ¡DEPLOYMENT EXITOSO!');
    console.log('📋 Program ID:', programKeypair.publicKey.toString());
    console.log('🌐 Explorer:',
      `https://explorer.solana.com/address/${programKeypair.publicKey.toString()}?cluster=devnet`);

    return {
      success: true,
      programId: programKeypair.publicKey.toString(),
      explorerUrl:
        `https://explorer.solana.com/address/${programKeypair.publicKey.toString()}?cluster=devnet`
    };

  } catch (error) {
    console.error('❌ Error en deployment:', error.message);
    throw error;
  }
}

deployProgram()
  .then(result => {
    console.log('\n✅ DEPLOYMENT COMPLETADO');
    console.log('Program ID:', result.programId);
    console.log('Explorer:', result.explorerUrl);
  })
  .catch(error => {
    console.error('\n💥 DEPLOYMENT FALLÓ:', error.message);
    process.exit(1);
  });
