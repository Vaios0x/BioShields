#!/usr/bin/env node

const { createWalletClient, createPublicClient, http, parseEther } = require('viem')
const { baseSepolia, optimismSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')
const fs = require('fs')
const path = require('path')

// ABI del contrato SimpleBioShield
const SIMPLE_BIOSHIELD_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_coverageAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_premium", "type": "uint256" },
      { "internalType": "string", "name": "_triggerConditions", "type": "string" }
    ],
    "name": "createPolicy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_coverageAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_premium", "type": "uint256" },
      { "internalType": "string", "name": "_triggerConditions", "type": "string" },
      { "internalType": "uint256", "name": "_livesAmount", "type": "uint256" }
    ],
    "name": "createPolicyWithLives",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPoolStats",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "totalPolicies", "type": "uint256" },
          { "internalType": "uint256", "name": "totalCoverage", "type": "uint256" },
          { "internalType": "uint256", "name": "totalPremiums", "type": "uint256" },
          { "internalType": "uint256", "name": "activePolicies", "type": "uint256" }
        ],
        "internalType": "struct SimpleBioShield.PoolStats",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPolicyCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
]

async function deploySimpleContract() {
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
  const privateKey = process.env.PRIVATE_KEY || '0x' + '0'.repeat(64) // Placeholder
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

      // Bytecode del contrato (necesitarías compilar el contrato primero)
      // Por ahora, vamos a usar un contrato simple
      const contractBytecode = '0x608060405234801561001057600080fd5b5061001a61001f565b6100de565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00805468010000000000000000900460ff161561007a5760405163f92ee8a960e01b815260040160405180910390fd5b80546001600160401b03908116146100d95780546001600160401b0319166001600160401b0390811782556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50565b6102a3806100ed6000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80638da5cb5b1461003b578063f2fde38b14610059575b600080fd5b610043610075565b60405161005091906101d1565b60405180910390f35b610073600480360381019061006e919061021d565b61009e565b005b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b8060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a38060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a350565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101a58261017a565b9050919050565b6101b58161019a565b82525050565b60006020820190506101d060008301846101ac565b92915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610205826101da565b9050919050565b610215816101fa565b811461022057600080fd5b50565b6000813590506102328161020c565b9291505056fea2646970667358221220...' // Bytecode simplificado

      console.log('📝 Deploying contract...')
      
      // Deploy contract
      const hash = await walletClient.deployContract({
        abi: SIMPLE_BIOSHIELD_ABI,
        bytecode: contractBytecode,
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
        console.log('✅ getPoolStats works:', poolStats)
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
}

deploySimpleContract().catch(console.error)
