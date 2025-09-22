#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { baseSepolia, optimismSepolia } = require('viem/chains')

// ABI para BioShield
const BIOSHIELD_ABI = [
  {
    "inputs": [],
    "name": "getPolicyCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPolicies",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "address", "name": "policyholder", "type": "address" },
          { "internalType": "uint256", "name": "coverageAmount", "type": "uint256" },
          { "internalType": "uint256", "name": "premium", "type": "uint256" },
          { "internalType": "string", "name": "triggerConditions", "type": "string" },
          { "internalType": "bool", "name": "isActive", "type": "bool" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
        ],
        "internalType": "struct BioShield.Policy",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

async function testCompleteContracts() {
  console.log('🔍 Probando contratos completos...\n')
  
  const contracts = {
    baseSepolia: {
      chain: baseSepolia,
      rpc: 'https://sepolia.base.org',
      address: '0xEB5112813E48e67e3dE7419B8a9cE93e30A83e3a' // Contrato completo
    },
    optimismSepolia: {
      chain: optimismSepolia,
      rpc: 'https://sepolia.optimism.io',
      address: '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9' // Contrato completo
    }
  }

  for (const [networkName, config] of Object.entries(contracts)) {
    console.log(`\n🌐 ${networkName.toUpperCase()}:`)
    console.log(`Address: ${config.address}`)
    
    const client = createPublicClient({
      chain: config.chain,
      transport: http(config.rpc)
    })

    try {
      // Verificar balance
      const balance = await client.getBalance({ address: config.address })
      console.log(`Balance: ${balance.toString()} wei`)

      // Verificar getPolicyCount
      try {
        const policyCount = await client.readContract({
          address: config.address,
          abi: BIOSHIELD_ABI,
          functionName: 'getPolicyCount'
        })
        console.log(`✅ getPolicyCount: ${policyCount.toString()}`)
      } catch (error) {
        console.log(`❌ getPolicyCount: ${error.message}`)
      }

      // Verificar getPolicies
      try {
        const policies = await client.readContract({
          address: config.address,
          abi: BIOSHIELD_ABI,
          functionName: 'getPolicies'
        })
        console.log(`✅ getPolicies: ${policies.length} policies`)
      } catch (error) {
        console.log(`❌ getPolicies: ${error.message}`)
      }

    } catch (error) {
      console.log(`❌ Error general: ${error.message}`)
    }
  }

  console.log('\n💡 CONCLUSIÓN:')
  console.log('Si los contratos completos funcionan, necesitamos:')
  console.log('1. Actualizar las direcciones en el código')
  console.log('2. Usar los contratos completos en lugar de los básicos')
}

testCompleteContracts().catch(console.error)
