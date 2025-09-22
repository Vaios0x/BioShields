#!/usr/bin/env node

/**
 * BioShield Program Executable Fix
 * Senior Blockchain Developer Full Stack - September 2025
 * 
 * Este script verifica y corrige el estado ejecutable del programa Solana
 */

const { Connection, PublicKey, Keypair, sendAndConfirmTransaction, SystemProgram, Transaction } = require('@solana/web3.js');
const fs = require('fs');

async function fixProgramExecutable() {
    try {
        console.log('🔧 Fixing BioShield Program Executable Status...');
        console.log('================================================================');

        // Setup connection
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

        // Load program and wallet keypairs
        const programKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('./rust/program-keypair.json')))
        );
        const walletKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('./rust/wallet-keypair.json')))
        );

        const programId = programKeypair.publicKey;
        console.log('📋 Program ID:', programId.toString());
        console.log('🔑 Wallet Address:', walletKeypair.publicKey.toString());

        // Get current program info
        console.log('🔄 Fetching current program info...');
        const programInfo = await connection.getAccountInfo(programId);
        
        if (!programInfo) {
            throw new Error('Program account not found');
        }

        console.log('📊 Current Program Status:');
        console.log('  - Executable:', programInfo.executable);
        console.log('  - Owner:', programInfo.owner.toString());
        console.log('  - Size:', programInfo.data.length, 'bytes');
        console.log('  - Lamports:', programInfo.lamports);

        // Check if program is already executable
        if (programInfo.executable) {
            console.log('✅ Program is already executable!');
            return;
        }

        // The issue is that the program is deployed but not marked as executable
        // This typically happens when the program is deployed as a regular account
        // We need to redeploy it properly as an executable program

        console.log('⚠️  Program is not executable. This requires redeployment.');
        console.log('🔄 Checking if we have the compiled program binary...');

        const programBinaryPath = './rust/target/deploy/bioshield_insurance.so';
        
        if (!fs.existsSync(programBinaryPath)) {
            console.log('❌ Program binary not found. Building program...');
            
            // Build the program
            const { execSync } = require('child_process');
            try {
                execSync('cd rust && anchor build', { stdio: 'inherit' });
                console.log('✅ Program built successfully');
            } catch (error) {
                console.error('❌ Failed to build program:', error.message);
                throw error;
            }
        }

        // Check wallet balance
        const walletBalance = await connection.getBalance(walletKeypair.publicKey);
        console.log('💰 Wallet Balance:', (walletBalance / 1e9).toFixed(4), 'SOL');

        if (walletBalance < 2e9) { // Less than 2 SOL
            console.log('💧 Requesting SOL airdrop...');
            try {
                const signature = await connection.requestAirdrop(walletKeypair.publicKey, 2e9);
                await connection.confirmTransaction(signature);
                console.log('✅ Airdrop successful');
            } catch (error) {
                console.log('⚠️  Airdrop failed, but continuing...');
            }
        }

        console.log('🚀 Redeploying program as executable...');
        
        // Read the program binary
        const programBinary = fs.readFileSync(programBinaryPath);
        console.log('📦 Program binary size:', programBinary.length, 'bytes');

        // Calculate deployment cost
        const deploymentCost = (programBinary.length * 0.00000348) + 0.001;
        console.log('💰 Estimated deployment cost:', deploymentCost.toFixed(4), 'SOL');

        // Deploy the program
        const deploySignature = await connection.deployProgram(
            programBinary,
            programKeypair,
            {
                commitment: 'confirmed',
                maxRetries: 5,
                skipPreflight: false,
                preflightCommitment: 'confirmed'
            }
        );

        console.log('⏳ Waiting for deployment confirmation...');
        await connection.confirmTransaction(deploySignature, 'confirmed');

        // Verify the deployment
        console.log('🔍 Verifying deployment...');
        const newProgramInfo = await connection.getAccountInfo(programId);
        
        if (!newProgramInfo) {
            throw new Error('Program not found after deployment');
        }

        console.log('📊 New Program Status:');
        console.log('  - Executable:', newProgramInfo.executable);
        console.log('  - Owner:', newProgramInfo.owner.toString());
        console.log('  - Size:', newProgramInfo.data.length, 'bytes');
        console.log('  - Lamports:', newProgramInfo.lamports);

        if (newProgramInfo.executable) {
            console.log('🎉 SUCCESS! Program is now executable!');
            
            // Update deployment verification
            const verificationData = {
                verified: true,
                timestamp: new Date().toISOString(),
                program_id: programId.toString(),
                program_exists: true,
                program_executable: true,
                program_size: newProgramInfo.data.length,
                program_owner: newProgramInfo.owner.toString(),
                program_lamports: newProgramInfo.lamports,
                is_bpf_upgradeable: newProgramInfo.owner.toString() === 'BPFLoaderUpgradeab1e11111111111111111111111',
                wallet_address: walletKeypair.publicKey.toString(),
                wallet_balance_sol: await connection.getBalance(walletKeypair.publicKey) / 1e9,
                explorer_url: `https://explorer.solana.com/address/${programId.toString()}?cluster=devnet`,
                deployment_successful: true,
                cluster: "devnet",
                status: "deployed_and_executable",
                deployment_signature: deploySignature
            };

            fs.writeFileSync('./deployment-verification.json', JSON.stringify(verificationData, null, 2));
            console.log('💾 Updated deployment verification file');
            
        } else {
            console.log('❌ Program is still not executable after redeployment');
            throw new Error('Failed to make program executable');
        }

        console.log('\n🎯 PROGRAM EXECUTABLE FIX COMPLETED!');
        console.log('📍 Program is now properly deployed and executable');
        console.log('🌐 Explorer URL:', `https://explorer.solana.com/address/${programId.toString()}?cluster=devnet`);

    } catch (error) {
        console.error('❌ Error fixing program executable status:', error.message);
        
        // Update verification with error
        const errorData = {
            verified: false,
            timestamp: new Date().toISOString(),
            program_id: null,
            deployment_successful: false,
            status: "executable_fix_failed",
            error: error.message
        };

        fs.writeFileSync('./deployment-verification.json', JSON.stringify(errorData, null, 2));
        throw error;
    }
}

// Execute the fix
if (require.main === module) {
    fixProgramExecutable()
        .then(() => {
            console.log('\n✅ EXECUTABLE FIX COMPLETED SUCCESSFULLY');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ EXECUTABLE FIX FAILED');
            console.error('Error:', error.message);
            process.exit(1);
        });
}

module.exports = { fixProgramExecutable };
