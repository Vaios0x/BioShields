const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const fs = require('fs');

async function verifyDeployment() {
    try {
        console.log('🔍 Verifying BioShields deployment on Solana devnet...');

        // Setup connection
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

        // Load program ID
        const programKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('./rust/program-keypair.json')))
        );
        const programId = programKeypair.publicKey;

        console.log('📋 Program ID:', programId.toString());

        // Get program account info
        console.log('🔄 Fetching program account info...');
        const programInfo = await connection.getAccountInfo(programId);

        if (!programInfo) {
            throw new Error('Program account not found on Solana devnet');
        }

        console.log('✅ Program found on devnet!');
        console.log('📦 Program size:', programInfo.data.length, 'bytes');
        console.log('🏦 Owner:', programInfo.owner.toString());
        console.log('💰 Lamports:', programInfo.lamports);
        console.log('⚡ Executable:', programInfo.executable);

        // Check if it's a BPF program
        const BPF_LOADER_UPGRADEABLE_ID = new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
        const isBPFProgram = programInfo.owner.equals(BPF_LOADER_UPGRADEABLE_ID);

        console.log('🔧 BPF Upgradeable Program:', isBPFProgram);

        // Get wallet info
        const walletKeypair = Keypair.fromSecretKey(
            new Uint8Array(JSON.parse(fs.readFileSync('./rust/wallet-keypair.json')))
        );

        console.log('🔑 Wallet Address:', walletKeypair.publicKey.toString());

        const walletBalance = await connection.getBalance(walletKeypair.publicKey);
        console.log('💰 Wallet Balance:', (walletBalance / 1e9).toFixed(4), 'SOL');

        // Update deployment verification
        const verificationData = {
            verified: true,
            timestamp: new Date().toISOString(),
            program_id: programId.toString(),
            program_exists: true,
            program_executable: programInfo.executable,
            program_size: programInfo.data.length,
            program_owner: programInfo.owner.toString(),
            program_lamports: programInfo.lamports,
            is_bpf_upgradeable: isBPFProgram,
            wallet_address: walletKeypair.publicKey.toString(),
            wallet_balance_sol: walletBalance / 1e9,
            explorer_url: `https://explorer.solana.com/address/${programId.toString()}?cluster=devnet`,
            deployment_successful: true,
            cluster: "devnet",
            status: "deployed_and_verified"
        };

        fs.writeFileSync('./deployment-verification.json', JSON.stringify(verificationData, null, 2));

        console.log('\n🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!');
        console.log('📍 Program deployed and verified on Solana devnet');
        console.log('🌐 Explorer URL:', verificationData.explorer_url);

        return verificationData;

    } catch (error) {
        console.error('❌ Verification failed:', error.message);

        // Update verification with error
        const errorData = {
            verified: false,
            timestamp: new Date().toISOString(),
            program_id: null,
            deployment_successful: false,
            status: "verification_failed",
            error: error.message
        };

        fs.writeFileSync('./deployment-verification.json', JSON.stringify(errorData, null, 2));

        throw error;
    }
}

verifyDeployment()
    .then(result => {
        console.log('\n✅ VERIFICATION COMPLETED');
        console.log('Program Status: DEPLOYED AND VERIFIED ✅');
        console.log('Program ID:', result.program_id);
        console.log('Program Size:', result.program_size, 'bytes');
        console.log('Explorer:', result.explorer_url);
    })
    .catch(error => {
        console.error('\n❌ VERIFICATION FAILED');
        console.error('Error:', error.message);
        process.exit(1);
    });