#!/usr/bin/env node

const { createWalletClient, createPublicClient, http, parseEther } = require('viem')
const { baseSepolia, optimismSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')
const fs = require('fs')
const path = require('path')

// Cargar el bytecode compilado
const contractPath = path.join(__dirname, '..', 'artifacts', 'solidity', 'contracts', 'SimpleBioShield.sol', 'SimpleBioShield.json')
const contractArtifact = JSON.parse(fs.readFileSync(contractPath, 'utf8'))

const SIMPLE_BIOSHIELD_ABI = contractArtifact.abi
const SIMPLE_BIOSHIELD_BYTECODE = contractArtifact.bytecode

async function deploySimpleBioShield() {
  console.log('🚀 Desplegando SimpleBioShield contract...\n')
  
  // Configuración de redes
  const networks = {
    baseSepolia: {
      chain: baseSepolia,
      rpc: 'https://sepolia.base.org',
      name: 'Base Sepolia'
    },
    optimismSepolia: {
      chain: optimismSepolia,
      rpc: 'https://sepolia.optimism.io',
      name: 'Optimism Sepolia'
    }
  }

  // Usar la cuenta del owner (mismo que los contratos existentes)
  const privateKey = '0xa664aeeb847952b84144df7b9fdecec732e834fc89487b9e0db11deb26fcceba'
  const account = privateKeyToAccount(privateKey)
  
  console.log('👤 Deployer account:', account.address)
  
  const deploymentResults = {}

  for (const [networkKey, network] of Object.entries(networks)) {
    console.log(`\n🌐 Desplegando en ${network.name}...`)
    
    try {
      const publicClient = createPublicClient({
        chain: network.chain,
        transport: http(network.rpc)
      })

      const walletClient = createWalletClient({
        account,
        chain: network.chain,
        transport: http(network.rpc)
      })

      // Verificar balance
      const balance = await publicClient.getBalance({ address: account.address })
      console.log('💰 Balance:', balance.toString(), 'wei')
      
      if (balance < parseEther('0.001')) {
        console.log('❌ Insufficient balance for deployment')
        continue
      }

      console.log('📝 Deploying contract...')
      
      // Deploy contract
      const hash = await walletClient.deployContract({
        abi: SIMPLE_BIOSHIELD_ABI,
        bytecode: SIMPLE_BIOSHIELD_BYTECODE,
        args: []
      })

      console.log('⏳ Transaction hash:', hash)
      
      // Wait for deployment
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      console.log('✅ Contract deployed at:', receipt.contractAddress)
      
      // Test the deployed contract
      const contractAddress = receipt.contractAddress
      
      // Test getPoolStats
      try {
        const poolStats = await publicClient.readContract({
          address: contractAddress,
          abi: SIMPLE_BIOSHIELD_ABI,
          functionName: 'getPoolStats'
        })
        console.log('✅ getPoolStats works:', {
          totalPolicies: poolStats[0].toString(),
          totalCoverage: poolStats[1].toString(),
          totalPremiums: poolStats[2].toString(),
          activePolicies: poolStats[3].toString()
        })
      } catch (error) {
        console.log('❌ getPoolStats failed:', error.message)
      }

      // Test getPolicyCount
      try {
        const policyCount = await publicClient.readContract({
          address: contractAddress,
          abi: SIMPLE_BIOSHIELD_ABI,
          functionName: 'getPolicyCount'
        })
        console.log('✅ getPolicyCount works:', policyCount.toString())
      } catch (error) {
        console.log('❌ getPolicyCount failed:', error.message)
      }

      // Test owner
      try {
        const owner = await publicClient.readContract({
          address: contractAddress,
          abi: SIMPLE_BIOSHIELD_ABI,
          functionName: 'owner'
        })
        console.log('✅ owner works:', owner)
      } catch (error) {
        console.log('❌ owner failed:', error.message)
      }

      deploymentResults[networkKey] = {
        address: contractAddress,
        txHash: hash,
        explorer: network.chain.blockExplorers?.default?.url || 'N/A'
      }

    } catch (error) {
      console.log('❌ Deployment failed:', error.message)
      deploymentResults[networkKey] = { error: error.message }
    }
  }

  // Save deployment results
  const deploymentFile = path.join(__dirname, '..', 'simple-bioshield-deployment.json')
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentResults, null, 2))
  
  console.log('\n📄 Deployment results saved to:', deploymentFile)
  console.log('\n🎯 RESUMEN:')
  
  for (const [network, result] of Object.entries(deploymentResults)) {
    if (result.error) {
      console.log(`❌ ${network}: ${result.error}`)
    } else {
      console.log(`✅ ${network}: ${result.address}`)
      console.log(`   Explorer: ${result.explorer}/address/${result.address}`)
    }
  }

  console.log('\n💡 PRÓXIMOS PASOS:')
  console.log('1. Actualizar las variables de entorno con las nuevas direcciones')
  console.log('2. Actualizar el código para usar los nuevos contratos')
  console.log('3. Probar las transacciones reales en el demo')
}

deploySimpleBioShield().catch(console.error)
