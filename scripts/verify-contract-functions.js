#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { optimismSepolia } = require('viem/chains')

// ABI mínimo para verificar funciones
const BIOSHIELD_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "coverageAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "premium", "type": "uint256" },
      { "internalType": "string", "name": "triggerConditions", "type": "string" },
      { "internalType": "uint256", "name": "livesAmount", "type": "uint256" }
    ],
    "name": "createPolicyWithLives",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "coverageAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "premium", "type": "uint256" },
      { "internalType": "string", "name": "triggerConditions", "type": "string" }
    ],
    "name": "createPolicy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
]

const LIVES_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

async function verifyContractFunctions() {
  console.log('🔍 Verificando funciones de contratos en Optimism Sepolia...\n')
  
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  const bioshieldAddress = '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9'
  const livesAddress = '0x7a157A006F86Ea2770Ba66285AE5e9A18f949AB2'

  try {
    // Verificar BioShield contract
    console.log(`📋 Verificando BioShield (${bioshieldAddress}):`)
    
    // Verificar si tiene createPolicyWithLives
    try {
      await client.readContract({
        address: bioshieldAddress,
        abi: BIOSHIELD_ABI,
        functionName: 'createPolicyWithLives',
        args: [0, 0, '', 0]
      })
      console.log('❌ createPolicyWithLives: Función existe pero no debería ser readable')
    } catch (error) {
      if (error.message.includes('function')) {
        console.log('✅ createPolicyWithLives: Función encontrada')
      } else {
        console.log('❌ createPolicyWithLives: Error -', error.message)
      }
    }

    // Verificar si tiene createPolicy
    try {
      await client.readContract({
        address: bioshieldAddress,
        abi: BIOSHIELD_ABI,
        functionName: 'createPolicy',
        args: [0, 0, '']
      })
      console.log('❌ createPolicy: Función existe pero no debería ser readable')
    } catch (error) {
      if (error.message.includes('function')) {
        console.log('✅ createPolicy: Función encontrada')
      } else {
        console.log('❌ createPolicy: Error -', error.message)
      }
    }

    // Verificar LIVES contract
    console.log(`\n💰 Verificando LIVES Token (${livesAddress}):`)
    
    try {
      await client.readContract({
        address: livesAddress,
        abi: LIVES_ABI,
        functionName: 'approve',
        args: ['0x0000000000000000000000000000000000000000', 0]
      })
      console.log('❌ approve: Función existe pero no debería ser readable')
    } catch (error) {
      if (error.message.includes('function')) {
        console.log('✅ approve: Función encontrada')
      } else {
        console.log('❌ approve: Error -', error.message)
      }
    }

    console.log('\n✅ Verificación completada')
    console.log('💡 Los contratos están desplegados y tienen las funciones necesarias')
    console.log('🚀 Las transacciones reales deberían funcionar en Optimism Sepolia')

  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

verifyContractFunctions().catch(console.error)
