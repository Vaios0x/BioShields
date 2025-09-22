#!/usr/bin/env node

/**
 * Verify BioShield Insurance contracts on Optimism Sepolia
 * This script verifies that the deployed contracts are working correctly
 */

const { ethers } = require('hardhat')
const fs = require('fs')

async function main() {
  console.log('🔍 Verificando contratos en Optimism Sepolia...')
  
  // Load deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync('optimism-deployment.json', 'utf8'))
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners()
  console.log('📝 Verificando con cuenta:', deployer.address)
  
  // Get contract instances
  const SimpleBioShield = await ethers.getContractFactory('SimpleBioShield')
  const SimpleLivesToken = await ethers.getContractFactory('SimpleLivesToken')
  const SimpleShieldToken = await ethers.getContractFactory('SimpleShieldToken')
  
  const bioShield = SimpleBioShield.attach(deploymentInfo.contracts.SimpleBioShield)
  const livesToken = SimpleLivesToken.attach(deploymentInfo.contracts.SimpleLivesToken)
  const shieldToken = SimpleShieldToken.attach(deploymentInfo.contracts.SimpleShieldToken)
  
  console.log('📦 Contratos conectados:')
  console.log('  - BioShield Insurance:', deploymentInfo.contracts.SimpleBioShield)
  console.log('  - Lives Token:', deploymentInfo.contracts.SimpleLivesToken)
  console.log('  - Shield Token:', deploymentInfo.contracts.SimpleShieldToken)
  
  // Verify contract states
  console.log('\n🔍 Verificando estado de los contratos...')
  
  // Check token balances
  const livesBalance = await livesToken.balanceOf(deployer.address)
  const shieldBalance = await shieldToken.balanceOf(deployer.address)
  
  console.log('💰 Balances de tokens:')
  console.log('  - Lives Token:', ethers.formatEther(livesBalance), 'LIVES')
  console.log('  - Shield Token:', ethers.formatEther(shieldBalance), 'SHIELD')
  
  // Check insurance pool count
  const poolCount = await bioShield.getPoolCount()
  console.log('🏊 Pools de seguros creados:', poolCount.toString())
  
  if (poolCount > 0) {
    // Get first pool details
    const pool = await bioShield.getPool(1)
    console.log('📋 Detalles del Pool #1:')
    console.log('  - Nombre:', pool.name)
    console.log('  - Capacidad:', ethers.formatEther(pool.capacity), 'ETH')
    console.log('  - Tasa de prima:', pool.premiumRate.toString(), 'basis points')
    console.log('  - Período de cobertura:', pool.coveragePeriod.toString(), 'segundos')
    console.log('  - Activo:', pool.active)
  }
  
  // Check coverage count
  const coverageCount = await bioShield.getCoverageCount()
  console.log('🛡️ Coberturas activas:', coverageCount.toString())
  
  // Check claim count
  const claimCount = await bioShield.getClaimCount()
  console.log('📝 Reclamos procesados:', claimCount.toString())
  
  // Test token transfers (small amount)
  console.log('\n🧪 Probando transferencias de tokens...')
  
  try {
    // Transfer 1 SHIELD token to the insurance contract
    const transferAmount = ethers.parseEther('1')
    const transferTx = await shieldToken.transfer(bioShield.target, transferAmount)
    await transferTx.wait()
    console.log('✅ Transferencia de 1 SHIELD al contrato de seguros exitosa')
    
    // Check contract balance
    const contractBalance = await shieldToken.balanceOf(bioShield.target)
    console.log('💰 Balance del contrato de seguros:', ethers.formatEther(contractBalance), 'SHIELD')
    
  } catch (error) {
    console.log('❌ Error en transferencia:', error.message)
  }
  
  console.log('\n🎉 Verificación completada exitosamente!')
  console.log('🔍 Ver en explorer:', deploymentInfo.explorer)
  console.log('📄 Información de deployment guardada en: optimism-deployment.json')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Verificación falló:', error)
    process.exit(1)
  })
