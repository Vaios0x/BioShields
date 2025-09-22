#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { optimismSepolia } = require('viem/chains')

async function analyzeContractBytecode() {
  console.log('🔍 Analizando bytecode del contrato en Optimism Sepolia...\n')
  
  const contractAddress = '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9'
  
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  try {
    // Obtener el bytecode del contrato
    const bytecode = await client.getBytecode({ address: contractAddress })
    if (!bytecode || bytecode === '0x') {
      console.log('❌ No se encontró bytecode')
      return
    }
    
    console.log('✅ Bytecode encontrado')
    console.log('📏 Tamaño del bytecode:', bytecode.length, 'caracteres')
    
    // Buscar selectores de función comunes
    const commonSelectors = {
      '0x8da5cb5b': 'owner()',
      '0x8456cb59': 'paused()',
      '0x5c60da1b': 'implementation()',
      '0x70a08231': 'balanceOf(address)',
      '0xa9059cbb': 'transfer(address,uint256)',
      '0x095ea7b3': 'approve(address,uint256)',
      '0x18160ddd': 'totalSupply()',
      '0x06fdde03': 'name()',
      '0x95d89b41': 'symbol()',
      '0x313ce567': 'decimals()'
    }
    
    console.log('\n🔍 Buscando selectores de función en el bytecode...')
    
    for (const [selector, functionName] of Object.entries(commonSelectors)) {
      if (bytecode.includes(selector)) {
        console.log(`✅ ${functionName} - Selector: ${selector}`)
      } else {
        console.log(`❌ ${functionName} - Selector: ${selector}`)
      }
    }
    
    // Buscar selectores específicos de BioShield
    const bioshieldSelectors = {
      '0xac8f789b': 'createPolicyWithLives(uint256,uint256,string,uint256)',
      '0x12345678': 'createPolicy(uint256,uint256,string)', // Placeholder
      '0x87654321': 'submitClaim(uint256)', // Placeholder
      '0x11111111': 'getUserPolicies(address)', // Placeholder
      '0x22222222': 'getPoolStats()', // Placeholder
    }
    
    console.log('\n🔍 Buscando selectores específicos de BioShield...')
    
    for (const [selector, functionName] of Object.entries(bioshieldSelectors)) {
      if (bytecode.includes(selector)) {
        console.log(`✅ ${functionName} - Selector: ${selector}`)
      } else {
        console.log(`❌ ${functionName} - Selector: ${selector}`)
      }
    }
    
    // Verificar si es un contrato proxy
    console.log('\n🔍 Verificando si es un contrato proxy...')
    
    // Buscar selectores de proxy
    const proxySelectors = {
      '0x5c60da1b': 'implementation()',
      '0x3659cfe6': 'upgradeTo(address)',
      '0x4f1ef286': 'upgradeToAndCall(address,bytes)',
      '0x8f283970': 'changeAdmin(address)',
      '0xf851a440': 'admin()'
    }
    
    let isProxy = false
    for (const [selector, functionName] of Object.entries(proxySelectors)) {
      if (bytecode.includes(selector)) {
        console.log(`✅ ${functionName} - Selector: ${selector}`)
        isProxy = true
      }
    }
    
    if (isProxy) {
      console.log('\n🎯 CONCLUSIÓN: Este es un contrato PROXY')
      console.log('💡 Necesitamos obtener la dirección de implementación')
    } else {
      console.log('\n🎯 CONCLUSIÓN: Este es un contrato directo')
      console.log('💡 El problema puede ser el ABI que estamos usando')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

analyzeContractBytecode().catch(console.error)
