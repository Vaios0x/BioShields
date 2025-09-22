#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { optimismSepolia } = require('viem/chains')

async function analyzeContractABI() {
  console.log('🔍 Analizando ABI del contrato en Optimism Sepolia...\n')
  
  const contractAddress = '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9'
  
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  try {
    // Obtener el código del contrato
    const code = await client.getBytecode({ address: contractAddress })
    if (!code || code === '0x') {
      console.log('❌ No se encontró código en el contrato')
      return
    }
    
    console.log('✅ Contrato encontrado')
    console.log('📏 Tamaño del código:', code.length, 'caracteres')
    
    // Intentar algunas funciones comunes
    const commonFunctions = [
      'createPolicy',
      'createPolicyWithLives',
      'submitClaim',
      'processClaim',
      'getUserPolicies',
      'getPoolStats',
      'getPolicyCount',
      'getPolicies',
      'policies',
      'policyCount',
      'owner',
      'paused',
      'totalPolicies',
      'activePolicies'
    ]
    
    console.log('\n🧪 Probando funciones comunes...')
    
    for (const funcName of commonFunctions) {
      try {
        // Intentar como función view
        await client.readContract({
          address: contractAddress,
          abi: [{
            "inputs": [],
            "name": funcName,
            "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
          }],
          functionName: funcName
        })
        console.log(`✅ ${funcName}: Función encontrada (view)`)
      } catch (error) {
        if (error.message.includes('function') && !error.message.includes('reverted')) {
          console.log(`✅ ${funcName}: Función encontrada (no view)`)
        } else {
          console.log(`❌ ${funcName}: ${error.message.split('\n')[0]}`)
        }
      }
    }
    
    // Verificar si es un contrato proxy
    console.log('\n🔍 Verificando si es un contrato proxy...')
    try {
      const implementation = await client.readContract({
        address: contractAddress,
        abi: [{
          "inputs": [],
          "name": "implementation",
          "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'implementation'
      })
      console.log(`✅ Es un proxy. Implementation: ${implementation}`)
    } catch (error) {
      console.log('❌ No es un proxy o no tiene función implementation')
    }
    
    // Verificar si tiene función admin
    console.log('\n🔍 Verificando funciones administrativas...')
    try {
      const owner = await client.readContract({
        address: contractAddress,
        abi: [{
          "inputs": [],
          "name": "owner",
          "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'owner'
      })
      console.log(`✅ Owner: ${owner}`)
    } catch (error) {
      console.log('❌ No tiene función owner')
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

analyzeContractABI().catch(console.error)
