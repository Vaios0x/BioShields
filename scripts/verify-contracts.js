#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { baseSepolia, optimismSepolia } = require('viem/chains')

// Configuración de redes
const networks = {
  baseSepolia: {
    chain: baseSepolia,
    rpc: 'https://sepolia.base.org',
    contracts: {
      bioshield: '0xEB5112813E48e67e3dE7419B8a9cE93e30A83e3a',
      lives: '0x6C9372Dcc93E4F89a0F58123F26CcA3E71A69279'
    }
  },
  optimismSepolia: {
    chain: optimismSepolia,
    rpc: 'https://sepolia.optimism.io',
    contracts: {
      bioshield: '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9',
      lives: '0x7a157A006F86Ea2770Ba66285AE5e9A18f949AB2'
    }
  }
}

async function verifyContract(client, address, name) {
  try {
    const code = await client.getBytecode({ address })
    if (code && code !== '0x') {
      console.log(`✅ ${name} (${address}): Contract deployed`)
      return true
    } else {
      console.log(`❌ ${name} (${address}): No contract found`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${name} (${address}): Error - ${error.message}`)
    return false
  }
}

async function verifyNetwork(networkName, config) {
  console.log(`\n🔍 Verificando ${networkName.toUpperCase()}:`)
  console.log(`RPC: ${config.rpc}`)
  
  const client = createPublicClient({
    chain: config.chain,
    transport: http(config.rpc)
  })

  const results = {}
  
  for (const [contractName, address] of Object.entries(config.contracts)) {
    results[contractName] = await verifyContract(client, address, contractName)
  }
  
  return results
}

async function main() {
  console.log('🚀 Verificando contratos en redes de testnet...\n')
  
  const baseResults = await verifyNetwork('Base Sepolia', networks.baseSepolia)
  const optimismResults = await verifyNetwork('Optimism Sepolia', networks.optimismSepolia)
  
  console.log('\n📊 RESUMEN:')
  console.log('Base Sepolia:')
  console.log(`  BioShield: ${baseResults.bioshield ? '✅' : '❌'}`)
  console.log(`  LIVES: ${baseResults.lives ? '✅' : '❌'}`)
  
  console.log('Optimism Sepolia:')
  console.log(`  BioShield: ${optimismResults.bioshield ? '✅' : '❌'}`)
  console.log(`  LIVES: ${optimismResults.lives ? '✅' : '❌'}`)
  
  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:')
  if (!optimismResults.bioshield || !optimismResults.lives) {
    console.log('❌ Optimism Sepolia necesita deployment de contratos')
    console.log('   Ejecuta: npm run deploy:optimism')
  } else {
    console.log('✅ Todos los contratos están desplegados')
  }
}

main().catch(console.error)
