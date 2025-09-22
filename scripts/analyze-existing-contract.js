#!/usr/bin/env node

const { createPublicClient, http, parseAbiItem } = require('viem')
const { baseSepolia, optimismSepolia } = require('viem/chains')

async function analyzeExistingContract() {
  console.log('🔍 Analizando contrato existente para entender por qué fallan las transacciones...\n')
  
  const contractAddress = '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9' // Optimism Sepolia
  
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  try {
    // Verificar que el contrato existe
    const code = await client.getBytecode({ address: contractAddress })
    if (!code || code === '0x') {
      console.log('❌ No contract found')
      return
    }
    console.log('✅ Contract exists')

    // Probar diferentes funciones para entender qué funciona
    const functionsToTest = [
      { name: 'owner', args: [], isView: true },
      { name: 'getPoolStats', args: [], isView: true },
      { name: 'getPolicyCount', args: [], isView: true },
      { name: 'paused', args: [], isView: true },
      { name: 'totalPolicies', args: [], isView: true },
      { name: 'activePolicies', args: [], isView: true },
      { name: 'policyCount', args: [], isView: true },
      { name: 'policies', args: [0], isView: true },
      { name: 'getPolicies', args: [], isView: true },
      { name: 'getUserPolicies', args: ['0x0000000000000000000000000000000000000000'], isView: true }
    ]

    console.log('\n🧪 Probando funciones del contrato...')
    
    for (const func of functionsToTest) {
      try {
        const abiItem = parseAbiItem(`function ${func.name}(${func.args.map(() => 'uint256').join(',')}) view returns (uint256)`)
        
        if (func.name === 'owner') {
          const abiItem = parseAbiItem('function owner() view returns (address)')
          const result = await client.readContract({
            address: contractAddress,
            abi: [abiItem],
            functionName: func.name,
            args: func.args
          })
          console.log(`✅ ${func.name}: ${result}`)
        } else if (func.name === 'getPoolStats') {
          const abiItem = parseAbiItem('function getPoolStats() view returns (uint256,uint256,uint256,uint256)')
          const result = await client.readContract({
            address: contractAddress,
            abi: [abiItem],
            functionName: func.name,
            args: func.args
          })
          console.log(`✅ ${func.name}: [${result.map(r => r.toString()).join(', ')}]`)
        } else if (func.name === 'paused') {
          const abiItem = parseAbiItem('function paused() view returns (bool)')
          const result = await client.readContract({
            address: contractAddress,
            abi: [abiItem],
            functionName: func.name,
            args: func.args
          })
          console.log(`✅ ${func.name}: ${result}`)
        } else {
          const result = await client.readContract({
            address: contractAddress,
            abi: [abiItem],
            functionName: func.name,
            args: func.args
          })
          console.log(`✅ ${func.name}: ${result.toString()}`)
        }
      } catch (error) {
        console.log(`❌ ${func.name}: ${error.message.split('\n')[0]}`)
      }
    }

    // Verificar balance del contrato
    const balance = await client.getBalance({ address: contractAddress })
    console.log('\n💰 Contract balance:', balance.toString(), 'wei')

    // Verificar si el contrato está pausado
    try {
      const paused = await client.readContract({
        address: contractAddress,
        abi: [parseAbiItem('function paused() view returns (bool)')],
        functionName: 'paused'
      })
      console.log('⏸️ Contract paused:', paused)
    } catch (error) {
      console.log('❌ Could not check if contract is paused')
    }

    console.log('\n💡 DIAGNÓSTICO:')
    console.log('Si getPoolStats funciona pero createPolicy falla:')
    console.log('1. El contrato está funcionando correctamente')
    console.log('2. Las validaciones internas están causando el fallo')
    console.log('3. Posibles causas:')
    console.log('   - El contrato requiere ETH como premium')
    console.log('   - El contrato requiere tokens LIVES')
    console.log('   - El contrato tiene restricciones de tiempo')
    console.log('   - El contrato requiere que el usuario tenga balance suficiente')
    console.log('   - El contrato está pausado')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

analyzeExistingContract().catch(console.error)