#!/usr/bin/env node

/**
 * Deploy BioShield Insurance to Solana Devnet - One Click
 * Using the provided wallet and private key
 */

const { spawn } = require('child_process');
const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');
const path = require('path');

// Wallet configuration
const WALLET_ADDRESS = '3S8EEWxgFTpoAPip78CBanP7xjNuUQK5Yb3Ezin4pFxF';
const PRIVATE_KEY = '4zS4n8UG8smHt4zzKgpv9qNTbNJLLb3zvPfUgC64NZFWkS4fpW34qxBvofRCYXNZxHhdsy5AFXMf1WfxCZo8NNJX';

// Program ID (already configured)
const PROGRAM_ID = '4dhx4aZHJUQLnekox1kpLsUmb8YZmT3WfaLyhxCCUifW';

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

async function deploySolanaProgram() {
    try {
        console.log('🚀 Iniciando deployment de BioShield Insurance en Solana Devnet...');
        console.log('================================================================');
        
        // 1. Setup wallet keypair
        console.log('🔑 Configurando wallet...');
        const walletKeypair = Keypair.fromSecretKey(bs58.default.decode(PRIVATE_KEY));
        
        if (walletKeypair.publicKey.toString() !== WALLET_ADDRESS) {
            throw new Error('Private key no coincide con la wallet address');
        }
        
        console.log('✅ Wallet Address:', walletKeypair.publicKey.toString());
        
        // Guardar wallet keypair
        const walletKeypairArray = Array.from(walletKeypair.secretKey);
        fs.writeFileSync('./rust/wallet-keypair.json', JSON.stringify(walletKeypairArray));
        console.log('💾 Wallet keypair guardado');
        
        // 2. Verificar que el Program ID esté configurado correctamente
        console.log('🆔 Verificando Program ID...');
        console.log('📋 Program ID:', PROGRAM_ID);
        
        // Verificar que el declare_id! en lib.rs coincida
        const libRsPath = './rust/programs/bioshield-insurance/src/lib.rs';
        const libContent = fs.readFileSync(libRsPath, 'utf8');
        
        if (!libContent.includes(`declare_id!("${PROGRAM_ID}")`)) {
            console.log('⚠️ Actualizando declare_id! en lib.rs...');
            const updatedContent = libContent.replace(
                /declare_id!\("[^"]*"\)/,
                `declare_id!("${PROGRAM_ID}")`
            );
            fs.writeFileSync(libRsPath, updatedContent);
            console.log('✅ declare_id! actualizado');
        }
        
        // 3. Verificar que Anchor.toml tenga el Program ID correcto
        const anchorTomlPath = './rust/Anchor.toml';
        const anchorContent = fs.readFileSync(anchorTomlPath, 'utf8');
        
        if (!anchorContent.includes(`bioshield_insurance = "${PROGRAM_ID}"`)) {
            console.log('⚠️ Actualizando Program ID en Anchor.toml...');
            const updatedAnchorContent = anchorContent.replace(
                /bioshield_insurance = "[^"]*"/g,
                `bioshield_insurance = "${PROGRAM_ID}"`
            );
            fs.writeFileSync(anchorTomlPath, updatedAnchorContent);
            console.log('✅ Anchor.toml actualizado');
        }
        
        // 4. Cambiar al directorio rust
        const originalDir = process.cwd();
        process.chdir('./rust');
        
        try {
            // 5. Verificar archivos requeridos
            const requiredFiles = [
                'Anchor.toml',
                'wallet-keypair.json',
                'programs/bioshield-insurance/src/lib.rs'
            ];
            
            for (const file of requiredFiles) {
                if (!fs.existsSync(file)) {
                    throw new Error(`Archivo requerido faltante: ${file}`);
                }
            }
            
            console.log('✅ Todos los archivos requeridos presentes');
            
            // 6. Build del programa
            console.log('🔨 Compilando programa BioShield Insurance...');
            await runCommand('anchor', ['build']);
            console.log('✅ Compilación exitosa');
            
            // 7. Verificar que el archivo .so existe
            const soFile = './target/deploy/bioshield_insurance.so';
            if (!fs.existsSync(soFile)) {
                throw new Error('Archivo .so no encontrado después de la compilación');
            }
            
            const stats = fs.statSync(soFile);
            console.log('📦 Tamaño del programa:', stats.size, 'bytes');
            
            // 8. Deploy a devnet
            console.log('🚀 Desplegando a Solana devnet...');
            console.log('⏳ Esto puede tomar varios minutos...');
            
            await runCommand('anchor', ['deploy', '--provider.cluster', 'devnet']);
            console.log('✅ Deployment exitoso');
            
            // 9. Verificar deployment
            console.log('🔍 Verificando deployment...');
            await runCommand('solana', ['program', 'show', PROGRAM_ID, '--url', 'devnet']);
            
            // 10. Guardar información de deployment
            const deploymentInfo = {
                program_id: PROGRAM_ID,
                wallet_address: WALLET_ADDRESS,
                deployment_date: new Date().toISOString(),
                cluster: 'devnet',
                program_size: stats.size,
                deployment_cost: '0.002 SOL (estimado)',
                solana_version: '2.0.14',
                anchor_version: '0.30.1',
                status: 'deployed',
                explorer_url: `https://explorer.solana.com/address/${PROGRAM_ID}?cluster=devnet`
            };
            
            fs.writeFileSync('../deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
            console.log('💾 Información de deployment guardada');
            
            console.log('\n🎉 ¡DEPLOYMENT EXITOSO!');
            console.log('================================================');
            console.log('📋 Program ID:', PROGRAM_ID);
            console.log('🔑 Wallet:', WALLET_ADDRESS);
            console.log('🌐 Explorer:', deploymentInfo.explorer_url);
            console.log('📦 Tamaño:', stats.size, 'bytes');
            console.log('💰 Costo estimado: 0.002 SOL');
            console.log('================================================');
            
            return {
                success: true,
                programId: PROGRAM_ID,
                walletAddress: WALLET_ADDRESS,
                explorerUrl: deploymentInfo.explorer_url,
                programSize: stats.size
            };
            
        } finally {
            // Volver al directorio original
            process.chdir(originalDir);
        }
        
    } catch (error) {
        console.error('❌ Error en deployment:', error.message);
        throw error;
    }
}

// Ejecutar deployment
deploySolanaProgram()
    .then(result => {
        console.log('\n✅ DEPLOYMENT COMPLETADO EXITOSAMENTE');
        console.log('Program ID:', result.programId);
        console.log('Wallet:', result.walletAddress);
        console.log('Explorer:', result.explorerUrl);
        console.log('Tamaño:', result.programSize, 'bytes');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 DEPLOYMENT FALLÓ:', error.message);
        process.exit(1);
    });
