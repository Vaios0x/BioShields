#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { optimismSepolia } = require('viem/chains')

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
    "name": "getPoolStats",
    "outputs": [
      { "internalType": "uint256", "name": "totalPolicies", "type": "uint256" },
      { "internalType": "uint256", "name": "totalCoverage", "type": "uint256" },
      { "internalType": "uint256", "name": "totalPremiums", "type": "uint256" },
      { "internalType": "uint256", "name": "activePolicies", "type": "uint256" }
    ],
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

async function testOriginalContract() {
  console.log('🔍 Probando contrato original en Optimism Sepolia...\n')
  
  // Probar ambas direcciones
  const contracts = [
    {
      name: 'Contrato Original',
      address: '0x0E98bc946F105e0371AD6D338d6814A4fcBBaC27'
    },
    {
      name: 'Contrato Completo',
      address: '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9'
    }
  ]
  
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  for (const contract of contracts) {
    console.log(`\n📋 ${contract.name}:`)
    console.log(`Address: ${contract.address}`)
    
    try {
      // Verificar que el contrato existe
      const code = await client.getBytecode({ address: contract.address })
      if (!code || code === '0x') {
        console.log('❌ No contract found')
        continue
      }
      console.log('✅ Contract exists')

      // Verificar owner
      try {
        const owner = await client.readContract({
          address: contract.address,
          abi: BIOSHIELD_ABI,
          functionName: 'owner'
        })
        console.log('✅ Owner:', owner)
      } catch (error) {
        console.log('❌ Owner failed:', error.message.split('\n')[0])
      }

      // Verificar getPolicyCount
      try {
        const policyCount = await client.readContract({
          address: contract.address,
          abi: BIOSHIELD_ABI,
          functionName: 'getPolicyCount'
        })
        console.log('✅ getPolicyCount:', policyCount.toString())
      } catch (error) {
        console.log('❌ getPolicyCount failed:', error.message.split('\n')[0])
      }

      // Verificar getPoolStats
      try {
        const poolStats = await client.readContract({
          address: contract.address,
          abi: BIOSHIELD_ABI,
          functionName: 'getPoolStats'
        })
        console.log('✅ getPoolStats:', {
          totalPolicies: poolStats[0].toString(),
          totalCoverage: poolStats[1].toString(),
          totalPremiums: poolStats[2].toString(),
          activePolicies: poolStats[3].toString()
        })
      } catch (error) {
        console.log('❌ getPoolStats failed:', error.message.split('\n')[0])
      }

      // Verificar balance
      const balance = await client.getBalance({ address: contract.address })
      console.log('💰 Balance:', balance.toString(), 'wei')

    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }

  console.log('\n💡 CONCLUSIÓN:')
  console.log('Necesitamos usar el contrato que tenga las funciones que funcionan')
  console.log('Si ambos fallan, necesitamos desplegar un contrato nuevo y funcional')
}

testOriginalContract().catch(console.error)
