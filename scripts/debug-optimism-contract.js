#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { optimismSepolia } = require('viem/chains')

// ABI completo para BioShield
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
  },
  {
    "inputs": [],
    "name": "getPolicyCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
]

async function debugOptimismContract() {
  console.log('🔍 Debugging Optimism Sepolia contract...\n')
  
  const bioshieldAddress = '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9'
  
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  try {
    // 1. Verificar que el contrato existe
    console.log('1️⃣ Verificando contrato...')
    const code = await client.getBytecode({ address: bioshieldAddress })
    if (!code || code === '0x') {
      console.log('❌ Contrato no encontrado')
      return
    }
    console.log('✅ Contrato encontrado')

    // 2. Verificar funciones disponibles
    console.log('\n2️⃣ Verificando funciones...')
    
    try {
      const policyCount = await client.readContract({
        address: bioshieldAddress,
        abi: BIOSHIELD_ABI,
        functionName: 'getPolicyCount'
      })
      console.log('✅ getPolicyCount:', policyCount.toString())
    } catch (error) {
      console.log('❌ getPolicyCount error:', error.message)
    }

    try {
      const policies = await client.readContract({
        address: bioshieldAddress,
        abi: BIOSHIELD_ABI,
        functionName: 'getPolicies'
      })
      console.log('✅ getPolicies:', policies.length, 'policies found')
    } catch (error) {
      console.log('❌ getPolicies error:', error.message)
    }

    // 3. Verificar parámetros de la transacción
    console.log('\n3️⃣ Verificando parámetros de transacción...')
    const testParams = {
      coverageAmount: 500000n,
      premium: 25000n,
      triggerConditions: JSON.stringify({
        clinicalTrialId: 'NCT12345678',
        dataSource: 'clinicaltrials.gov'
      }),
      livesAmount: 12500n
    }
    
    console.log('Parámetros de prueba:')
    console.log('  coverageAmount:', testParams.coverageAmount.toString())
    console.log('  premium:', testParams.premium.toString())
    console.log('  triggerConditions:', testParams.triggerConditions)
    console.log('  livesAmount:', testParams.livesAmount.toString())

    // 4. Verificar si el contrato requiere ETH
    console.log('\n4️⃣ Verificando balance del contrato...')
    const contractBalance = await client.getBalance({ address: bioshieldAddress })
    console.log('Balance del contrato:', contractBalance.toString(), 'wei')

    // 5. Verificar si hay algún problema con el valor
    console.log('\n5️⃣ Verificando valor de transacción...')
    console.log('Premium en wei:', testParams.premium.toString())
    console.log('¿El contrato espera ETH como premium?')

    // 6. Verificar si el contrato tiene alguna restricción
    console.log('\n6️⃣ Verificando restricciones del contrato...')
    
    // Intentar leer el contrato para ver si hay algún estado que impida la creación
    try {
      // Verificar si hay algún estado que impida la creación de pólizas
      console.log('Verificando estado del contrato...')
    } catch (error) {
      console.log('Error verificando estado:', error.message)
    }

    console.log('\n💡 DIAGNÓSTICO:')
    console.log('El error "Internal JSON-RPC error" sugiere:')
    console.log('1. El contrato está recibiendo la transacción')
    console.log('2. Hay un problema interno en la ejecución')
    console.log('3. Posibles causas:')
    console.log('   - El contrato requiere ETH como premium')
    console.log('   - Hay restricciones en el contrato')
    console.log('   - El contrato no está inicializado correctamente')
    console.log('   - Hay un problema con los parámetros')

  } catch (error) {
    console.error('❌ Error general:', error.message)
  }
}

debugOptimismContract().catch(console.error)
