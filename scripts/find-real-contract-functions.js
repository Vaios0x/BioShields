#!/usr/bin/env node

const { createPublicClient, http } = require('viem')
const { optimismSepolia } = require('viem/chains')

async function findRealContractFunctions() {
  console.log('🔍 Buscando funciones reales del contrato...\n')
  
  const contractAddress = '0x45e5FDDa2B3215423B82b2502B388D5dA8944bA9'
  
  const client = createPublicClient({
    chain: optimismSepolia,
    transport: http('https://sepolia.optimism.io')
  })

  try {
    // Lista de selectores de función más comunes
    const allSelectors = {
      // OpenZeppelin Ownable
      '0x8da5cb5b': 'owner()',
      '0xf2fde38b': 'transferOwnership(address)',
      '0x715018a6': 'renounceOwnership()',
      
      // OpenZeppelin Pausable
      '0x8456cb59': 'paused()',
      '0x5c975abb': 'paused()',
      '0x3f4ba83a': 'unpause()',
      '0x8456cb59': 'pause()',
      
      // OpenZeppelin ReentrancyGuard
      '0x5c975abb': 'paused()',
      
      // ERC20
      '0x70a08231': 'balanceOf(address)',
      '0xa9059cbb': 'transfer(address,uint256)',
      '0x23b872dd': 'transferFrom(address,address,uint256)',
      '0x095ea7b3': 'approve(address,uint256)',
      '0x18160ddd': 'totalSupply()',
      '0x06fdde03': 'name()',
      '0x95d89b41': 'symbol()',
      '0x313ce567': 'decimals()',
      '0xdd62ed3e': 'allowance(address,address)',
      
      // ERC721
      '0x6352211e': 'ownerOf(uint256)',
      '0x42842e0e': 'safeTransferFrom(address,address,uint256)',
      '0xb88d4fde': 'safeTransferFrom(address,address,uint256,bytes)',
      '0x23b872dd': 'transferFrom(address,address,uint256)',
      '0xa22cb465': 'setApprovalForAll(address,bool)',
      '0x081812fc': 'getApproved(uint256)',
      '0xe985e9c5': 'isApprovedForAll(address,address)',
      
      // Proxy
      '0x5c60da1b': 'implementation()',
      '0x3659cfe6': 'upgradeTo(address)',
      '0x4f1ef286': 'upgradeToAndCall(address,bytes)',
      '0x8f283970': 'changeAdmin(address)',
      '0xf851a440': 'admin()',
      
      // Custom functions (common patterns)
      '0xac8f789b': 'createPolicyWithLives(uint256,uint256,string,uint256)',
      '0x12345678': 'createPolicy(uint256,uint256,string)',
      '0x87654321': 'submitClaim(uint256)',
      '0x11111111': 'getUserPolicies(address)',
      '0x22222222': 'getPoolStats()',
      '0x33333333': 'getPolicyCount()',
      '0x44444444': 'getPolicies()',
      '0x55555555': 'processClaim(uint256)',
      
      // Fallback functions
      '0x00000000': 'fallback()',
      '0x00000001': 'receive()'
    }
    
    // Obtener bytecode
    const bytecode = await client.getBytecode({ address: contractAddress })
    if (!bytecode || bytecode === '0x') {
      console.log('❌ No se encontró bytecode')
      return
    }
    
    console.log('✅ Bytecode encontrado')
    console.log('📏 Tamaño:', bytecode.length, 'caracteres')
    
    console.log('\n🔍 Funciones encontradas en el contrato:')
    let foundFunctions = 0
    
    for (const [selector, functionName] of Object.entries(allSelectors)) {
      if (bytecode.includes(selector)) {
        console.log(`✅ ${functionName} - ${selector}`)
        foundFunctions++
      }
    }
    
    if (foundFunctions === 0) {
      console.log('❌ No se encontraron funciones conocidas')
      console.log('💡 Este puede ser un contrato personalizado o con funciones no estándar')
    } else {
      console.log(`\n📊 Total de funciones encontradas: ${foundFunctions}`)
    }
    
    // Verificar si es un contrato vacío o básico
    if (bytecode.length < 1000) {
      console.log('\n⚠️  El bytecode es muy pequeño, puede ser un contrato básico')
    }
    
    // Verificar si tiene constructor
    if (bytecode.includes('608060405234801561001057600080fd5b50')) {
      console.log('\n✅ Parece tener un constructor estándar')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

findRealContractFunctions().catch(console.error)
