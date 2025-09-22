const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * Deploy BioShieldInsurance contract to Base Sepolia and Optimism Sepolia
 */

async function main() {
  console.log('🚀 Iniciando deployment del contrato BioShieldInsurance completo...');

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log('📝 Desplegando con la cuenta:', deployer.address);
  console.log('💰 Balance de la cuenta:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');

  // Contract addresses (these should already be deployed)
  const LIVES_TOKEN_BASE = '0x6C9372Dcc93E4F89a0F58123F26CcA3E71A69279';
  const SHIELD_TOKEN_BASE = '0xD196B1d67d101E2D6634F5d6F238F7716A8f41AE';
  
  const LIVES_TOKEN_OPTIMISM = '0x7a157A006F86Ea2770Ba66285AE5e9A18f949AB2';
  const SHIELD_TOKEN_OPTIMISM = '0x15164c7C1E5ced9788c2fB82424fe595950ee261';

  const deploymentResults = {};

  // Deploy to Base Sepolia
  console.log('\n🔵 Desplegando en Base Sepolia...');
  try {
    const BioShieldInsurance = await ethers.getContractFactory('BioShieldInsurance');
    const bioshieldBase = await BioShieldInsurance.deploy(LIVES_TOKEN_BASE, SHIELD_TOKEN_BASE);
    await bioshieldBase.waitForDeployment();

    const bioshieldBaseAddress = await bioshieldBase.getAddress();
    console.log('✅ BioShieldInsurance desplegado en Base Sepolia:', bioshieldBaseAddress);

    deploymentResults.baseSepolia = {
      network: 'base-sepolia',
      chainId: 84532,
      deployer: deployer.address,
      contracts: {
        BioShieldInsurance: bioshieldBaseAddress,
        LivesToken: LIVES_TOKEN_BASE,
        ShieldToken: SHIELD_TOKEN_BASE
      },
      explorer: 'https://sepolia.basescan.org',
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Ver en Base Sepolia Explorer:', `https://sepolia.basescan.org/address/${bioshieldBaseAddress}`);
  } catch (error) {
    console.error('❌ Error desplegando en Base Sepolia:', error.message);
  }

  // Deploy to Optimism Sepolia
  console.log('\n🟠 Desplegando en Optimism Sepolia...');
  try {
    const BioShieldInsurance = await ethers.getContractFactory('BioShieldInsurance');
    const bioshieldOptimism = await BioShieldInsurance.deploy(LIVES_TOKEN_OPTIMISM, SHIELD_TOKEN_OPTIMISM);
    await bioshieldOptimism.waitForDeployment();

    const bioshieldOptimismAddress = await bioshieldOptimism.getAddress();
    console.log('✅ BioShieldInsurance desplegado en Optimism Sepolia:', bioshieldOptimismAddress);

    deploymentResults.optimismSepolia = {
      network: 'optimism-sepolia',
      chainId: 11155420,
      deployer: deployer.address,
      contracts: {
        BioShieldInsurance: bioshieldOptimismAddress,
        LivesToken: LIVES_TOKEN_OPTIMISM,
        ShieldToken: SHIELD_TOKEN_OPTIMISM
      },
      explorer: 'https://sepolia-optimism.etherscan.io',
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Ver en Optimism Sepolia Explorer:', `https://sepolia-optimism.etherscan.io/address/${bioshieldOptimismAddress}`);
  } catch (error) {
    console.error('❌ Error desplegando en Optimism Sepolia:', error.message);
  }

  // Save deployment results
  const deploymentFile = path.join(__dirname, '..', 'bioshield-complete-deployment.json');
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResults, null, 2));
  console.log('\n💾 Resultados de deployment guardados en:', deploymentFile);

  // Generate environment variables
  console.log('\n📋 Variables de entorno para agregar a .env:');
  console.log('\n# BioShieldInsurance Complete Contract Addresses');
  if (deploymentResults.baseSepolia) {
    console.log(`NEXT_PUBLIC_BASE_BIOSHIELD_COMPLETE=${deploymentResults.baseSepolia.contracts.BioShieldInsurance}`);
  }
  if (deploymentResults.optimismSepolia) {
    console.log(`NEXT_PUBLIC_OPTIMISM_BIOSHIELD_COMPLETE=${deploymentResults.optimismSepolia.contracts.BioShieldInsurance}`);
  }

  console.log('\n🎉 Deployment completado!');
  console.log('\n📝 Próximos pasos:');
  console.log('1. Actualizar las variables de entorno con las nuevas direcciones');
  console.log('2. Actualizar el hook useInsurance para usar las nuevas direcciones');
  console.log('3. Probar la funcionalidad de crear pólizas con descuentos de LIVES');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error en el deployment:', error);
    process.exit(1);
  });
