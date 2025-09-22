#!/usr/bin/env node

/**
 * Deploy BioShield Insurance contracts to Base Sepolia
 * This script deploys the insurance contracts and initializes the system
 */

const { ethers } = require('hardhat')

// Base Sepolia configuration
const baseSepoliaConfig = {
  chainId: 84532,
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  explorerUrl: 'https://sepolia.basescan.org',
}

async function main() {
  console.log('🚀 Iniciando deployment en Base Sepolia...')
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log('📝 Deploying contracts with account:', deployer.address)
  console.log('💰 Account balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH')
  
  // Deploy Lives Token first
  console.log('🪙 Deploying Lives Token...')
  const SimpleLivesToken = await ethers.getContractFactory('SimpleLivesToken')
  const livesToken = await SimpleLivesToken.deploy()
  await livesToken.waitForDeployment()
  
  const livesTokenAddress = await livesToken.getAddress()
  console.log('✅ Lives Token deployed to:', livesTokenAddress)
  
  // Deploy Shield Token
  console.log('🛡️ Deploying Shield Token...')
  const SimpleShieldToken = await ethers.getContractFactory('SimpleShieldToken')
  const shieldToken = await SimpleShieldToken.deploy()
  await shieldToken.waitForDeployment()
  
  const shieldTokenAddress = await shieldToken.getAddress()
  console.log('✅ Shield Token deployed to:', shieldTokenAddress)
  
  // Deploy BioShield Insurance contract
  console.log('📦 Deploying BioShield Insurance contract...')
  const SimpleBioShield = await ethers.getContractFactory('SimpleBioShield')
  const bioShieldInsurance = await SimpleBioShield.deploy(
    livesTokenAddress,
    shieldTokenAddress
  )
  await bioShieldInsurance.waitForDeployment()
  
  const insuranceAddress = await bioShieldInsurance.getAddress()
  console.log('✅ BioShield Insurance deployed to:', insuranceAddress)
  
  // Create initial insurance pool
  console.log('🏊 Creating initial insurance pool...')
  const poolTx = await bioShieldInsurance.createInsurancePool(
    'Biotech Research Pool',
    'Pool for biotech research insurance',
    ethers.parseEther('1000'), // 1000 ETH capacity
    100, // 1% premium rate (100 basis points)
    30 * 24 * 60 * 60 // 30 days coverage period
  )
  await poolTx.wait()
  console.log('✅ Initial insurance pool created')
  
  // Save deployment info
  const deploymentInfo = {
    network: 'base-sepolia',
    chainId: baseSepoliaConfig.chainId,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      SimpleBioShield: insuranceAddress,
      SimpleLivesToken: livesTokenAddress,
      SimpleShieldToken: shieldTokenAddress,
    },
    explorer: baseSepoliaConfig.explorerUrl,
  }
  
  const fs = require('fs')
  fs.writeFileSync(
    'base-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  )
  
  console.log('📄 Deployment info saved to base-deployment.json')
  console.log('🔍 View on explorer:', baseSepoliaConfig.explorerUrl)
  console.log('🎉 Deployment completed successfully!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  })
