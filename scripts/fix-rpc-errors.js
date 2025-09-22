#!/usr/bin/env node

/**
 * Script para diagnosticar y resolver errores de RPC comunes
 * Especialmente "replacement transaction underpriced" y "Internal JSON-RPC error"
 */

const { createPublicClient, createWalletClient, http, parseEther, formatEther } = require('viem')
const { baseSepolia, optimismSepolia } = require('viem/chains')
const { privateKeyToAccount } = require('viem/accounts')

// Configuración
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x' + '0'.repeat(64) // Placeholder
const BIOSHIELD_ABI = [
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
    "inputs": [],
    "name": "getPoolStats",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" },
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]

const CONTRACTS = {
  baseSepolia: {
    address: '0x01931850d5eb80370a2b8de8e419f638eefd875d',
    chain: baseSepolia,
    rpcUrl: 'https://sepolia.base.org'
  },
  optimismSepolia: {
    address: '0x9f6f13a1f3d5929f11911da3dde7a4b903ab9cbf',
    chain: optimismSepolia,
    rpcUrl: 'https://sepolia.optimism.io'
  }
}

async function diagnoseRpcErrors() {
  console.log('🔍 Diagnosticando errores de RPC...\n')

  for (const [networkName, config] of Object.entries(CONTRACTS)) {
    console.log(`🌐 Analizando ${networkName.toUpperCase()}...`)
    
    try {
      // Crear cliente público
      const publicClient = createPublicClient({
        chain: config.chain,
        transport: http(config.rpcUrl)
      })

      // Verificar estado del contrato
      const poolStats = await publicClient.readContract({
        address: config.address,
        abi: BIOSHIELD_ABI,
        functionName: 'getPoolStats'
      })

      console.log(`📊 Pool Stats:`, {
        totalPolicies: poolStats[0].toString(),
        totalCoverage: poolStats[1].toString(),
        totalPremiums: poolStats[2].toString(),
        activePolicies: poolStats[3].toString()
      })

      // Verificar balance del contrato
      const balance = await publicClient.getBalance({
        address: config.address
      })

      console.log(`💰 Contract Balance: ${formatEther(balance)} ETH`)
      console.log(`✅ ${networkName} está funcionando correctamente\n`)

    } catch (error) {
      console.error(`❌ Error en ${networkName}:`, error.message)
      console.log(`🔧 Posibles soluciones:`)
      
      if (error.message.includes('fetch')) {
        console.log(`   - Verificar conexión a internet`)
        console.log(`   - El RPC puede estar temporalmente inaccesible`)
      }
      
      if (error.message.includes('timeout')) {
        console.log(`   - Aumentar timeout de la petición`)
        console.log(`   - Reintentar la operación`)
      }
      
      console.log('')
    }
  }
}

async function testTransactionWithRetry() {
  console.log('🧪 Probando transacción con lógica de reintento...\n')

  if (!process.env.PRIVATE_KEY || process.env.PRIVATE_KEY === '0x' + '0'.repeat(64)) {
    console.log('⚠️  PRIVATE_KEY no configurada, saltando prueba de transacción')
    console.log('   Para probar transacciones, configura PRIVATE_KEY en .env')
    return
  }

  const account = privateKeyToAccount(process.env.PRIVATE_KEY)

  for (const [networkName, config] of Object.entries(CONTRACTS)) {
    console.log(`🌐 Probando transacción en ${networkName.toUpperCase()}...`)
    
    try {
      const publicClient = createPublicClient({
        chain: config.chain,
        transport: http(config.rpcUrl)
      })

      const walletClient = createWalletClient({
        account,
        chain: config.chain,
        transport: http(config.rpcUrl)
      })

      // Obtener nonce actual
      const nonce = await publicClient.getTransactionCount({
        address: account.address
      })

      console.log(`📝 Nonce actual: ${nonce}`)

      // Intentar transacción con diferentes estrategias
      const strategies = [
        { name: 'Estrategia 1: Gas automático', gas: undefined, gasPrice: undefined },
        { name: 'Estrategia 2: Gas fijo', gas: 500000n, gasPrice: undefined },
        { name: 'Estrategia 3: Gas con precio', gas: 500000n, gasPrice: 1000000000n }
      ]

      for (const strategy of strategies) {
        try {
          console.log(`   🔄 ${strategy.name}...`)
          
          const txHash = await walletClient.writeContract({
            address: config.address,
            abi: BIOSHIELD_ABI,
            functionName: 'createPolicy',
            args: [
              BigInt(100000), // coverage amount
              BigInt(5000),   // premium
              JSON.stringify({
                clinicalTrialId: 'NCT12345678',
                dataSource: 'clinicaltrials.gov'
              })
            ],
            value: BigInt(5000), // premium amount
            gas: strategy.gas,
            gasPrice: strategy.gasPrice,
            nonce: nonce
          })

          console.log(`   ✅ Éxito con ${strategy.name}`)
          console.log(`   📄 TX Hash: ${txHash}`)
          break // Salir del loop si la transacción fue exitosa

        } catch (strategyError) {
          console.log(`   ❌ Falló ${strategy.name}: ${strategyError.message}`)
          
          if (strategyError.message.includes('replacement transaction underpriced')) {
            console.log(`   💡 Solución: Esperar a que se confirme la transacción anterior o usar nonce más alto`)
          }
          
          if (strategyError.message.includes('insufficient funds')) {
            console.log(`   💡 Solución: Asegurar que la wallet tenga suficiente ETH`)
          }
        }
      }

    } catch (error) {
      console.error(`❌ Error general en ${networkName}:`, error.message)
    }
    
    console.log('')
  }
}

async function provideSolutions() {
  console.log('🔧 SOLUCIONES PARA ERRORES COMUNES:\n')
  
  console.log('1. "replacement transaction underpriced"')
  console.log('   - Causa: Transacción pendiente con el mismo nonce')
  console.log('   - Solución: Esperar confirmación o usar nonce más alto')
  console.log('   - Implementación: Lógica de reintento con backoff exponencial\n')
  
  console.log('2. "Internal JSON-RPC error"')
  console.log('   - Causa: Error interno del nodo RPC')
  console.log('   - Solución: Reintentar con diferentes parámetros de gas')
  console.log('   - Implementación: Múltiples estrategias de gas\n')
  
  console.log('3. "nonce too low"')
  console.log('   - Causa: Nonce ya usado o muy bajo')
  console.log('   - Solución: Obtener nonce actual del blockchain')
  console.log('   - Implementación: Verificar nonce antes de enviar\n')
  
  console.log('4. "insufficient funds"')
  console.log('   - Causa: Balance insuficiente para gas + valor')
  console.log('   - Solución: Verificar balance antes de transacción')
  console.log('   - Implementación: Validación previa de fondos\n')
  
  console.log('5. "gas limit exceeded"')
  console.log('   - Causa: Límite de gas muy bajo')
  console.log('   - Solución: Aumentar gas limit o optimizar contrato')
  console.log('   - Implementación: Gas limit dinámico basado en estimación\n')
}

async function main() {
  console.log('🚀 DIAGNÓSTICO DE ERRORES RPC - BioShields\n')
  
  await diagnoseRpcErrors()
  await testTransactionWithRetry()
  await provideSolutions()
  
  console.log('✅ Diagnóstico completado!')
  console.log('💡 Los errores de RPC son comunes en testnets y se pueden resolver con lógica de reintento.')
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  diagnoseRpcErrors,
  testTransactionWithRetry,
  provideSolutions
}
