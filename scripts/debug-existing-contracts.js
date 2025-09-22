#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { baseSepolia, optimismSepolia } = require('viem/chains')

// ABI simplificado para probar funciones básicas
const SIMPLE_ABI = [
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  }
]

async function debugExistingContracts() {
  console.log('🔍 Debugging existing contracts...\n')
  
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
      // Verificar que el contrato existe
      const code = await client.getBytecode({ address: config.address })
      if (!code || code === '0x') {
        console.log('❌ No contract found at this address')
        continue
      }
      console.log('✅ Contract exists')

      // Verificar owner
      try {
        const owner = await client.readContract({
          address: config.address,
          abi: SIMPLE_ABI,
          functionName: 'owner'
        })
        console.log('✅ Owner:', owner)
      } catch (error) {
        console.log('❌ Owner function failed:', error.message.split('\n')[0])
      }

      // Verificar si está pausado
      try {
        const paused = await client.readContract({
          address: config.address,
          abi: SIMPLE_ABI,
          functionName: 'paused'
        })
        console.log('✅ Paused:', paused)
      } catch (error) {
        console.log('❌ Paused function failed:', error.message.split('\n')[0])
      }

      // Verificar balance del contrato
      const balance = await client.getBalance({ address: config.address })
      console.log('💰 Contract balance:', balance.toString(), 'wei')

      // Verificar balance del owner
      try {
        const owner = await client.readContract({
          address: config.address,
          abi: SIMPLE_ABI,
          functionName: 'owner'
        })
        const ownerBalance = await client.getBalance({ address: owner })
        console.log('💰 Owner balance:', ownerBalance.toString(), 'wei')
      } catch (error) {
        console.log('❌ Could not get owner balance')
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }

  console.log('\n💡 DIAGNÓSTICO:')
  console.log('Si los contratos existen pero las funciones fallan:')
  console.log('1. Puede ser un problema de ABI')
  console.log('2. Puede ser que el contrato esté pausado')
  console.log('3. Puede ser que falten validaciones básicas')
  console.log('4. Puede ser que el contrato no esté inicializado correctamente')
}

debugExistingContracts().catch(console.error)
