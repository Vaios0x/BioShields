#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { optimismSepolia } = require('viem/chains')

async function testPoolStats() {
  console.log('🔍 Probando getPoolStats en Optimism Sepolia...\n')
  
  const contractAddress = '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9'
  
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  try {
    // Probar getPoolStats
    const poolStats = await client.readContract({
      address: contractAddress,
      abi: [{
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
      }],
      functionName: 'getPoolStats'
    })
    
    console.log('✅ getPoolStats exitoso:')
    console.log('  totalPolicies:', poolStats[0].toString())
    console.log('  totalCoverage:', poolStats[1].toString())
    console.log('  totalPremiums:', poolStats[2].toString())
    console.log('  activePolicies:', poolStats[3].toString())
    
    // Verificar owner
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
    
    console.log('\n✅ Owner:', owner)
    
    // Verificar si el contrato está pausado
    try {
      const paused = await client.readContract({
        address: contractAddress,
        abi: [{
          "inputs": [],
          "name": "paused",
          "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
          "stateMutability": "view",
          "type": "function"
        }],
        functionName: 'paused'
      })
      console.log('✅ Paused:', paused)
    } catch (error) {
      console.log('❌ No tiene función paused')
    }
    
    // Verificar si hay algún problema con los parámetros
    console.log('\n💡 DIAGNÓSTICO:')
    console.log('El contrato está funcionando (getPoolStats funciona)')
    console.log('Las funciones createPolicy fallan por validaciones internas')
    console.log('Posibles causas:')
    console.log('1. El contrato requiere que el usuario tenga tokens LIVES')
    console.log('2. El contrato requiere que el usuario tenga ETH suficiente')
    console.log('3. El contrato tiene restricciones de tiempo o estado')
    console.log('4. Los parámetros no cumplen las validaciones del contrato')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testPoolStats().catch(console.error)
