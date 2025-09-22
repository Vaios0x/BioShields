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

async function compareContracts() {
  console.log('🔍 Comparando contratos entre Base Sepolia y Optimism Sepolia...\n')
  
  const contracts = {
    baseSepolia: {
      chain: baseSepolia,
      rpc: 'https://sepolia.base.org',
      address: '0x5C0F9F645E82cFB26918369Feb1189211511250e'
    },
    optimismSepolia: {
      chain: optimismSepolia,
      rpc: 'https://sepolia.optimism.io',
      address: '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9'
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
  console.log('Si Base Sepolia funciona y Optimism Sepolia no:')
  console.log('1. El contrato en Optimism Sepolia no está inicializado')
  console.log('2. Necesita ser desplegado correctamente')
  console.log('3. O necesita ser inicializado con fondos')
}

compareContracts().catch(console.error)
